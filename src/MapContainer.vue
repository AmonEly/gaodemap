<template>
 <div id="map" class="w-screen h-screen fixed"></div>
</template>

<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import { onMounted, ref, onUnmounted } from "vue";
import { useMapStore } from "./stores/map";

let map = null
const mapStore = useMapStore();

// 地图移动结束统一更新状态 + 获取城市
const mapChange = () => {
    // console.log('触发了移动事件');
    if(!map) return
    // 更新缩放、中心点到pinia
    const zoom = map.getZoom()
    mapStore.setZoom(zoom)
    const center = map.getCenter()
    const centerArr = [center.lng, center.lat]
    mapStore.setCenter(centerArr)

    // console.log('此时的中心坐标：', mapStore.center);

    const AMap = mapStore.AMap
    if(!AMap) return
    const geocoder = new AMap.Geocoder()
    geocoder.getAddress(centerArr, (status, result) => {
        if (status === "complete" && result.info === "OK") {
            if(zoom > 8){
                let city = result.regeocode.addressComponent.city || result.regeocode.addressComponent.province
                mapStore.setCity(city)
                // console.log('此时的城市：', mapStore.city);
            }else if(zoom > 4){
                let city = result.regeocode.addressComponent.province;
                mapStore.setCity(city)
                // console.log('此时的城市：', mapStore.city);
            }else{
                mapStore.setCity('全国')
                // console.log('此时的城市：', mapStore.city);
            }
        }
    })
}

onMounted(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "2a10fc411bb33304a8f2b072a935706d",
    };
    AMapLoader.load({
      key: "1bdcfd4584f4b2b2d0c57ba098afdb93",
      version: "2.0",
      plugins: [
        "AMap.Scale",
        "AMap.ToolBar",
        "AMap.ControlBar",
        "AMap.CitySearch",
        "AMap.Geocoder",
        "AMap.AutoComplete",
        "AMap.PlaceSearch",
        "AMap.Driving",
        'AMap.MoveAnimation',
      ],
    })
      .then((AMap) => {
        // 存入全局AMap对象
        mapStore.setAMap(AMap)
        var citySearch = new AMap.CitySearch();
        map =new AMap.Map("map", {
            viewMode: '3D',
            zoom:mapStore.zoom,
            center:mapStore.center
        })
        mapStore.setMap(map)

        //加载控件
        const scale = new AMap.Scale()
        map.addControl(scale)
        const toolBar = new AMap.ToolBar()
        map.addControl(toolBar)
        const controlBar = new AMap.ControlBar({
            position:{
                top:'10px',
                right:'10px'
            }
        })
        map.addControl(controlBar)

        citySearch.getLocalCity((status, result) => {
            if (status === "complete" && result.info === "OK") {
                mapStore.setCity(result.province)
                const { lng, lat } = result.geocodes[0].location;
                mapStore.setCenter([lng, lat])
            }else {
                console.log('IP定位失败,默认长沙');    
            }
        })
        mapChange()

        // 地图移动结束触发
        map.on('moveend', mapChange);
      })
      .catch((e) => {
        console.log('地图加载错误',e);
      });
})

// 正确销毁
onUnmounted(() => {
  if(map) map.destroy()
  map = null
})
</script>

<style scoped>

</style>