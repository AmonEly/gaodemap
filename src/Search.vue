<template>
    <div class="search-container fixed left-[12px] top-[12px] z-40">
        <div class="search-input bg-white flex h-[45px] p-[8px] items-center rounder shadow-md">
            <img
             src="/logo_1.png"
             alt=""
             class = "h-[34px] w-[34px] mr-[4px] hover:cursor-pointer"
            />
            <input
             type="text"
             placeholder="搜索位置 公交站 地铁站"
             class="w-[220px] focus:outline-none placeholder:text-gray-300"
             v-model="inputValue"
             @focus="isInputFocus=true"
             @blur="isInputFocus=false"
             @input="debouncedHandleSearch"
              />
            <img
             src="/放大镜.png"
             class="w-[20px] hover:cursor-pointer text-center"
             @click="handleSearch">
            <!-- <span class="hover:cursor-pointer">❌</span> -->
             <img src="/logo_2.png" alt=""
             class = "h-[25px] w-[25px] ml-[10px] hover:cursor-pointer ">
        </div>
        <div v-if="isInputFocus">
            <div class="search-box fixed w-[337px] top-[62px] left-[12px] bg-white rounded shadow-md overflow-hidden ">
                <!-- 四大分类 -->
                <div class="pois flex h-[100px]  px-[8px] border-b-2 border-dotted">
                    <div 
                        v-for="(item, index) in pois" 
                        :key="index" 
                        class="poi flex flex-col items-center hover:bg-gray-200 pt-[12px] flex-1 hover:cursor-pointer group"
                    >
                    <img :src="item.img" :alt="item.title" class="w-[45px] h-[45px]" />
                    <span class="group-hover:text-blue-400 mt-2">{{ item.title }}</span>
                    </div>
                </div>
                <!-- 历史搜索记录 -->
                <div class="history-pois">
                    <div
                    v-for = "(item, index) in historyPois"
                    class="relative group  hover:bg-gray-200 cursor-pointer">
                        <div class="history-poi flex items-center text-sm text-gray-400 p-2 mt-1 group-1">
                            <img src="/history.png" alt=""
                            class="w-[17px] h-[17px] mr-[4px]">
                            <span>{{item.name}}</span>
                        </div>
                        <span class="right-2 top-2  absolute hidden group-hover:block  text-gray cursor-pointer">
                            <img src="/cancel-1-copy.png" alt=""
                            class="w-[17px] h-[17px]">
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <!-- 搜索结果展示 -->
         <div v-show="isInputFocus === false && searchResults.length > 0">
            <ul class="w-[337px]">
                <li v-for="(item, index) in searchResults" :key="index"
                @click="searchPois(item)" 
                 class="bg-white p-2 flex hover:bg-gray-200 cursor-pointer text-sm items-center">
                    <img src="/position.png" alt="" class="w-[17px] h-[17px] mr-1 text-gray-300"">
                    <p class="truncate">
                        <span>{{ item.name }}</span>
                        <span class="text-gray-300 text-xs ml-1">{{ item.district }}</span>
                    </p>
                </li>
            </ul>
         </div>

    </div>

</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { deletePoi, getPoi, savePoi } from "./apis/index";
import { useMapStore } from "./stores/map";

const mapStore = useMapStore();

let markers = [];//点标记数组
const inputValue = ref("");//输入框的值
const isInputFocus = ref(false)//控制输入框聚焦且无输入时:展开四大分类和历史所所记录面板
const poisResult = ref([]);//pois结果
const searchResults = ref([]);//搜索结果

const historyPois = ref([
    { name: "上海市" },
    { name: "北京市" },
    { name: "广州市" },
]);//历史搜索记录
const isDrvingShow = ref(false);//是否显示驾车路线
const startValue = ref("");//起点
const endValue = ref("");//终点

//标记定时器
const timer = ref(null);
//定义driving
const driving = ref(null);
//清空markders的方法
function clearMarkers() {
    if(markers.length>0){
        markers.forEach((marker)=>{
            marker.setMap(null);
        })
        markers = [];
    }
}

const pois = [
    { title: "美食", img: "/search_food.png" },
    { title: "酒店", img: "/search_hotel.png" },
    { title: "景点", img: "/search_view.png" },
    { title: "小区", img: "/search_house.png" },
  ];

//防抖工具函数
const debounce = (fn, delay = 100) => {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

const handleSearch = () => {
    console.log('当前搜索值：', inputValue.value);
  //清空markers
  clearMarkers();
  //清空pois结果
  poisResult.value = [];
  if (inputValue.value.trim() === "") {
    searchResults.value = [];
    return;
  }
  isInputFocus.value = false;
  const geocoder = new AMap.Geocoder()
  geocoder.getAddress(mapStore.center, (status, result) => {
    if (status === "complete" && result.info === "OK") {
        let city = result.regeocode.addressComponent.city;
        console.log('当前城市：', city);
        let autoOptions = {
            city: city,
        }
        //实例化autoComplete
        var autoComplete = new AMap.Autocomplete(autoOptions);
        autoComplete.search(inputValue.value, function(status, result){
            searchResults.value = result.tips;
            console.log('搜索结果：', searchResults.value);
            
        })
    }
  })
}
const debouncedHandleSearch = debounce(handleSearch, 200)

//点击兴趣点搜索列表
const searchPois = async(item)=>{
    clearMarkers();
    let id = item.id;
    const placeSearch = new AMap.PlaceSearch()
    placeSearch.getDetails(id, function (status, result) {
        if(status === 'complete'){
            //查询成功时，result 即为对应的 POI 详情
            poisResult.value = result.poiList.pois;
            inputValue.value = result.poiList.pois[0].name;
            //将适口移动到poi的位置 同时添加点标记
            let marker = new AMap.Marker({
                position: new AMap.LngLat(
                result.poiList.pois[0].location.lng,
                result.poiList.pois[0].location.lat
                ), //经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
                title: result.poiList.pois[0].name,
            });
            markers.push(marker);

            const map = mapStore.map;
            console.log('当前点标记：',markers);
            map.add(marker);
            map.setFitView();
        }else if(status === 'error'){
            const name = item.name;
            const geocoder = new AMap.Geocoder();
            geocoder.getLocation(name, function (status, result) {
                if(status === 'complete'){
                    const city = result.geocodes[0]
                    // console.log('当前城市：', city);
                    const { lng, lat } = city.location
                    console.log(lng, lat);
                    const marker = new AMap.Marker({
                        position: new AMap.LngLat(lng, lat),
                        title: name,
                    });
                    markers.push(marker);
                    const map = mapStore.map;
                    // console.log('当前点标记：',markers);
                    map.add(marker);
                    map.setFitView();
                }
            })
        }
      
    });
}



</script>

<style scoped>
#search-container{
    position: relative; /* 或者 absolute/fixed */
    z-index: 10; /* 比地图容器高 */
}
</style>
