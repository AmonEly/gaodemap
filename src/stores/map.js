import { defineStore } from 'pinia'

// 地图全局状态仓库
export const useMapStore = defineStore('map', {
  state: () => ({
    map: null,     // 地图实例
    city: '',      // 当前城市/省份
    center: [112.982279, 28.19409],    // 中心点经纬度
    zoom: 7        // 地图缩放级别
  }),
  actions: {
    // 统一修改状态的方法
    setMap(val) {
      this.map = val
    },
    setAMap(val) {
      this.AMap = val
    },
    setCity(val) {
      this.city = val
    },
    setCenter(val) {
      this.center = val
    },
    setMapCenter(val){
      this.map.setCenter(val)
    },
    setZoom(val) {
      this.zoom = val
    }
  }
})

