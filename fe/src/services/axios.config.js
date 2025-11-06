import axios from "axios";
const instance = axios.create({
  baseURL: "/api",
});
instance.interceptors.request.use(function (config) {
  if (typeof window !== "undefined" && window && window.localStorage && window.localStorage.getItem('token')) {
    config.headers.Authorization = 'Bearer ' + window.localStorage.getItem('token');
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});


instance.interceptors.response.use(function onFulfilled(response) {

  if (response.data) {
    return response.data;
  }
  return response;
}, function onRejected(error) {

  if (error.response && error.response.data) {
    return error.response.data;
  }
  return Promise.reject(error);
});
export default instance;