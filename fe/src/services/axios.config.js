import axios from "axios";
const instance = axios.create({
  baseURL: "/api",
});
instance.interceptors.request.use(function (config) {
    if (typeof window !== "undefined" && window && window.localStorage && window.localStorage.getItem('token')) {
        config.headers.Authorization = 'Bearer ' + window.localStorage.getItem('token');
    } 
    // Do something before request is sent
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
}); 

instance.interceptors.response.use(function onFulfilled(response) {
  // Any status code that lie within the range of 2xx cause this function to trigger
  // Do something with response data
  if (response.data) {
    return response.data;
  }
  return response;
}, function onRejected(error) {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  if (error.response && error.response.data) {
    return error.response.data;
  }
  return Promise.reject(error);
});
export default instance;