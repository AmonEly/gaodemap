<template>
 <div id="map" class="w-screen h-screen fixed"></div>
</template>

<script setup>
import AMapLoader from "@amap/amap-jsapi-loader";
import { onMounted, reactive, ref, watch,onUnmounted } from "vue";
import { useMapStore } from "./stores/map";

let map = reactive({})
const mapStore = useMapStore();

const mapChange = () => {
    if(map){
        const zoom = map.getZoom()
        mapStore.setZoom(zoom)
        const center = map.getCenter()
        const centerArr = [center.lng, center.lat]
        mapStore.setCenter(centerArr)
        // console.log(mapStore.center, mapStore.zoom);
    }
}

onMounted(() => {
    console.log(mapStore);
    window._AMapSecurityConfig = {
      securityJsCode: "2a10fc411bb33304a8f2b072a935706d",
    };
    AMapLoader.load({
      key: "1bdcfd4584f4b2b2d0c57ba098afdb93", // 申请好的Web端开发者Key
      version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
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
      ], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
    })
      .then((AMap) => {
        //ip定位搜索工具实例
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
                right:'-10px',
                bottom:'80px'
            }
        })
        map.addControl(controlBar)
        citySearch.getLocalCity((status, result) => {
            if (status === "complete" && result.info === "OK") {
                let localCity = result.province
                mapStore.setCity(localCity)
                const { lng, lat } = result.geocodes[0].location;
                mapStore.setCenter([lng, lat])
            }else {
                console.log('浏览器定位ip地址失败,默认加载长沙');    
            }
        })

        map.on('moveend', () => {
            // console.log('触发地图平移时的事件');
            mapChange()
        });
      })
      .catch((e) => {
        console.log(e);
      });
})
// watch(
//   () => [mapStore.center, mapStore.zoom],
//   ([newCenter, newZoom]) => {
//     // 确保地图实例已存在
//     if (map?.setCenter) {
//       map.setCenter(newCenter)
//       map.setZoom(newZoom)
//     }
//   },
//   { deep: true } // 监听数组内部变化
// )

watch(mapStore.center, (newCenter) => {
    let zoom = map.getZoom()
    const geocoder = new AMap.Geocoder()
    geocoder.getAddress(newCenter, (status, result) => {
        if (status === "complete" && result.info === "OK") {
            if(zoom >8){
                let city=
                result.regeocode.addressComponent.city ||
                result.regeocode.addressComponent.province ||
                mapStore.setCity(city)
            }else if(zoom >4){
                let city= result.regeocode.addressComponent.province;
                mapStore.setCity(city)
            }else{
                mapStore.setCity('全国')
            }
        }
    })
})
onUnmounted(() => {
  map.destory()
})
</script>

<style scoped>

</style>