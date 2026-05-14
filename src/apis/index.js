//封装请求方法
import axios from "axios";
//添加历史poi
export const savePoi = (poi) => {
  //poi=>{poi_id,name,location:{lng,lat},id}
  return axios.post("http://localhost:3000/history-poi", poi);
};
//获取所有历史poi
export const getPoi = () => {
  return axios.get("http://localhost:3000/history-poi");
};
//删除某个poi
export const deletePoi = (id) => {
  return axios.delete(`http://localhost:3000/history-poi/${id}`);
};
