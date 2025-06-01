import axios from 'axios';
import { getDeviceId } from '../utils/storage';

// 创建API实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加设备ID到请求头
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers['X-Device-ID'] = deviceId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误状态码
      console.error('API Error:', error.response.data);
      
      // 可以根据状态码处理特定错误
      switch (error.response.status) {
        case 401:
          // 未授权，可能需要重新生成设备ID
          break;
        case 429:
          // 请求过多，实现重试逻辑
          break;
        default:
          break;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('No response received:', error.request);
    } else {
      // 请求设置时出错
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
