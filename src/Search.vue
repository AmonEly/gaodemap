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
             @blur="debounceBlur"
             @input="debouncedHandleSearch"
              />
            <img
             src="/放大镜.png"
             class="w-[20px] hover:cursor-pointer text-center"
             @click="handleSearch">
            <!-- <span class="hover:cursor-pointer">❌</span> -->
             <img src="/logo_2.png" alt=""
             class = "h-[25px] w-[25px] ml-[10px] hover:cursor-pointer "
             @click="isDrvingShow=true"
             >
        </div>
        <!-- 兴趣点和历史记录面板 -->
        <div v-if="isInputFocus">
            <div class="search-box fixed w-[337px] top-[62px] left-[12px] bg-white rounded shadow-md overflow-hidden ">
                <!-- 四大分类 -->
                <div class="pois flex h-[100px]  px-[8px] border-b-2 border-dotted">
                    <div 
                        v-for="(item, index) in pois" 
                        :key="index"
                        @click="searchPoi(item)"
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
                    class="relative group  hover:bg-gray-200 cursor-pointer"
                    @click="searchHistoryPoi(item)">
                        <div class="history-poi flex items-center text-sm text-gray-400 p-2 mt-1 group-1">
                            <img src="/history.png" alt=""
                            class="w-[17px] h-[17px] mr-[4px]">
                            <span>{{item.name}}</span>
                        </div>
                        <span @click.stop="deleteHistory(item)" 
                         class="right-2 top-2  absolute hidden group-hover:block  text-gray cursor-pointer">
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
         <!-- 导航面板 -->
          <div :class="['driving-box fixed top-[12px] left-[12px] w-[337px] duration-500 overflow-hidden rounded shadow-md',
          isDrvingShow? 'h-[200px]' : 'h-[0]']">
            <span v-if="isDrvingShow"
            @click="cancelDrving"
            class="fixed top-[20px] left-[320px] text-gray-100 cursor-pointer">
                <img src="/cancel-1-copy.png" alt="" class="w-[18px] h-[18px]">
            </span>
            <div class="driving-line h-[200px] bg-[#3d93fd] rounded-tl rounded-tr flex flex-col items-center justify-center gap-4">
                <input type="text" placeholder="请输入起点" v-model="startValue"
                class="outline-none bg-[#3587eb] text-[#acd7ff] px-2 py-1 rounded w-[70%] placeholder:text-gray-100"
                @change="(e) => startValue = e.target.value">
                <input type="text" placeholder="请输入终点" v-model="endValue"
                class="outline-none bg-[#3587eb] text-[#acd7ff] px-2 py-1 rounded w-[70%] placeholder:text-gray-100"
                @change="(e) => endValue = e.target.value">
                <button class="self-end mr-12 bg-[#559ffb] px-6 py-2 text-sm text-white rounded shadow-md"
                @click="goDriving">
                    开车去
                </button>
            </div>
        </div>
    </div>

</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useMapStore } from "./stores/map";

const mapStore = useMapStore();

let markers = [];//点标记数组
const inputValue = ref("");//输入框的值
const isInputFocus = ref(false)//控制输入框聚焦且无输入时:展开四大分类和历史所所记录面板
const poisResult = ref([]);//pois结果
const searchResults = ref([]);//搜索结果

const historyPois = ref([]);//历史搜索记录
const isDrvingShow = ref(false);//是否显示驾车路线
const startValue = ref("");//起点
const endValue = ref("");//终点

//标记定时器
const timer = ref(null);
//定义driving
let driving = ref(null);
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
const debounceBlur =debounce(()=>{
    isInputFocus.value = false;
},200)

//点击兴趣点搜索列表
const searchPois = async(item)=>{
    console.log('点击搜索结果：',item);
    clearMarkers();
    const map = mapStore.map;
    let id = item.id;
    let poi = {
                id: 1,
                name: item.name,
                poi_id: id,
                location: { lng: item.location.lng, lat: item.location.lat },
            };
    // await savePoi(poi);
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

            
            console.log('当前点标记：',markers);
            map.add(marker);
            map.setFitView();
            
            saveToLocalStorage(item)
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
                    // console.log('当前点标记：',markers);
                    map.add(marker);
                    map.setFitView();

                    saveToLocalStorage(item)
                }
            })
        }
    });
    
    
}

//保存至本地存储
function saveToLocalStorage(item) {
    const existingPois = localStorage.getItem('LocalStoragePois')
    let pois = existingPois ? JSON.parse(existingPois) : [];
    const { id, name, location } = item;

    const realPoiId = item.id || item.poi_id;

     const existIndex = pois.findIndex(p => p.poi_id === realPoiId);
     if (existIndex !== -1) {
        pois.splice(existIndex, 1) 
    }
    pois.unshift({
        id: Date.now(), // 时间戳当id，
        poi_id: realPoiId,
        name: name,
        location: location,
    })
    pois = pois.slice(0, 5)
    localStorage.setItem('LocalStoragePois', JSON.stringify(pois))
    getLocalStoragePois()
}

//从本地存储获取历史记录
function getLocalStoragePois() {
    const existingPois = localStorage.getItem('LocalStoragePois')
    const pois = existingPois ? JSON.parse(existingPois) : [];
    historyPois.value = pois.slice(-5);
}

//点击历史记录Poi 进行搜索
const searchHistoryPoi = (item) => {
    clearMarkers();
    const map = mapStore.map;
    let id = item.poi_id;
    let name = item.name;
    let location = item.location;

    const position = [location[0], location[1]]
    console.log('点击历史记录Poi：',position);
    const placeSearch = new AMap.PlaceSearch();
    placeSearch.getDetails(id, function (status, result) {
      if (status === 'complete') {
        //查询成功时，result 即为对应的 POI 详情
        poisResult.value = result.poiList.pois;
        inputValue.value = result.poiList.pois[0].name;
        
        console.log('查询结果',result);
        //将适口移动到poi的位置 同时添加点标记
        let marker = new AMap.Marker({
            position: position,
            title: name,
        });
        markers.push(marker);
        // console.log('当前点标记：',markers);
        map.add(marker);
        map.setFitView();
        }
    });

    //  saveToLocalStorage(item)
};

function deleteHistory(item) {
    const existingPois = localStorage.getItem('LocalStoragePois')
  let pois = existingPois ? JSON.parse(existingPois) : [];

  // 2. 找到要删除的item的索引
  const index = pois.findIndex(p => p.poi_id === item.poi_id)
  if (index !== -1) {
    pois.splice(index, 1) // 删除该条记录
  }

  // 3. 更新本地存储
  localStorage.setItem('LocalStoragePois', JSON.stringify(pois))

  // 4. 更新页面上的响应式变量historyPois
  historyPois.value = pois
}

//根据四大分类搜索
const searchPoi = (item) => {
    let title = item.title;
    inputValue.value = title;
    // isInputFocus.value = false;
    clearMarkers();
    const map = mapStore.map;
    let currentCity = mapStore.city;
    const center = mapStore.center;
    console.log('中心坐标：', center);
    //根据当前城市搜索
    if(!currentCity){
        //根据当前中心坐标计算城市
        const geocoder = new AMap.Geocoder();
        const position = [center[0], center[1]]
        console.log('当前中心坐标：', position);
        geocoder.getAddress(position, function (status, result) {
            if(status === 'complete'){
                const { city } = result.regeocode.addressComponent;
                console.log('当前城市：', city);
                currentCity = city;
                mapStore.setCity(city);
            }
        })
    }
    const placeSearch = new AMap.PlaceSearch({
      //city 指定搜索所在城市，支持传入格式有：城市名、citycode 和 adcode
      city: currentCity,
    });
    placeSearch.search(title, function (status, result) {
      //查询成功时，result 即对应匹配的 POI 信息
      poisResult.value = result.poiList.pois;
      let res = result.poiList.pois;
      res.forEach((poi) => {
        let markder = new AMap.Marker({
          position: new AMap.LngLat(poi.location.lng, poi.location.lat),
          title: poi.name,
        });
        markers.push(markder);
        map.add(markder);
      });
      map.setFitView();
    });
}
  
onMounted(() => {
    getLocalStoragePois()
    
})

function cancelDrving() {
    closeDrving();
    endValue.value = "";
    startValue.value = "";
    if(driving){
        driving.clear()
    }
}

function closeDrving() {
    isDrvingShow.value = false;
}
//生成导航路线
function goDriving() {
    if(startValue.value === "" || endValue.value === ""){
        alert("请输入起点和终点");
        return;
    }

    if(mapStore.map&&mapStore.AMap){
        driving = new AMap.Driving({
            policy:0, //驾车路线规划策略，0是速度优先的策略
            map: mapStore.map,
        })
    }
    if(driving){
        driving.clear()
    }
    
    var points = [
        {keyword: startValue.value,city: mapStore.city},
        {keyword: endValue.value,city: mapStore.city},
    ]
    driving.search(points)
}

</script>

<style scoped>
#search-container{
    position: relative; /* 或者 absolute/fixed */
    z-index: 10; /* 比地图容器高 */
}
</style>
