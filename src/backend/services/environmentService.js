const axios = require('axios');
const Environment = require('../models/Environment');
const User = require('../models/User');

/**
 * 处理环境数据
 * @param {Object} data - 环境数据
 * @returns {Promise<Object>} 处理后的环境数据
 */
exports.processEnvironmentData = async (data) => {
  try {
    const { userId, deviceId, location, device, timestamp } = data;
    
    // 获取用户偏好
    const user = await User.findById(userId);
    const locationPrecision = user?.preferences?.privacySettings?.locationPrecision || 'city';
    
    // 根据位置精度设置处理坐标
    let coordinates = [location.longitude, location.latitude];
    if (locationPrecision === 'city') {
      // 降低精度到城市级别（保留小数点后两位）
      coordinates = [
        Math.round(location.longitude * 100) / 100,
        Math.round(location.latitude * 100) / 100
      ];
    } else if (locationPrecision === 'none') {
      // 不使用精确位置，使用IP定位或默认位置
      coordinates = [0, 0]; // 默认坐标，实际应用中可以使用IP定位
    }
    
    // 获取天气数据
    const weatherData = await fetchWeatherData(location.latitude, location.longitude);
    
    // 解析位置信息
    const locationInfo = await reverseGeocode(location.latitude, location.longitude, locationPrecision);
    
    // 处理时间信息
    const timeData = processTimeData(timestamp, locationInfo.timeZone);
    
    // 创建环境数据记录
    const environment = new Environment({
      userId,
      deviceId,
      location: {
        coordinates,
        accuracy: location.accuracy,
        placeName: locationInfo.placeName,
        country: locationInfo.country,
        administrativeArea: locationInfo.administrativeArea
      },
      weather: weatherData,
      time: timeData,
      device
    });
    
    await environment.save();
    return environment;
  } catch (error) {
    console.error('Environment data processing failed:', error);
    throw error;
  }
};

/**
 * 获取天气数据
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @returns {Promise<Object>} 天气数据
 */
const fetchWeatherData = async (latitude, longitude) => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      console.warn('OpenWeatherMap API key not configured');
      return getDefaultWeatherData();
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.error('Weather data fetch failed:', error);
    return getDefaultWeatherData();
  }
};

/**
 * 获取默认天气数据
 * @returns {Object} 默认天气数据
 */
const getDefaultWeatherData = () => {
  return {
    condition: 'Clear',
    description: 'clear sky',
    temperature: 20,
    humidity: 50,
    windSpeed: 5,
    pressure: 1013,
    icon: '01d'
  };
};

/**
 * 反向地理编码
 * @param {number} latitude - 纬度
 * @param {number} longitude - 经度
 * @param {string} precision - 位置精度
 * @returns {Promise<Object>} 位置信息
 */
const reverseGeocode = async (latitude, longitude, precision) => {
  try {
    // 这里可以使用Google Maps API或其他服务
    // 简化实现，使用OpenWeatherMap的地理编码API
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey || precision === 'none') {
      return getDefaultLocationInfo();
    }
    
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
    
    const response = await axios.get(url);
    const data = response.data[0];
    
    if (!data) {
      return getDefaultLocationInfo();
    }
    
    return {
      placeName: data.name,
      country: data.country,
      administrativeArea: data.state,
      timeZone: 'UTC' // 简化实现，实际应使用时区API
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return getDefaultLocationInfo();
  }
};

/**
 * 获取默认位置信息
 * @returns {Object} 默认位置信息
 */
const getDefaultLocationInfo = () => {
  return {
    placeName: 'Unknown',
    country: 'Unknown',
    administrativeArea: 'Unknown',
    timeZone: 'UTC'
  };
};

/**
 * 处理时间数据
 * @param {Date} timestamp - 时间戳
 * @param {string} timeZone - 时区
 * @returns {Object} 时间数据
 */
const processTimeData = (timestamp, timeZone) => {
  const date = new Date(timestamp);
  
  // 获取一天中的时段
  const hour = date.getHours();
  let timeOfDay;
  
  if (hour >= 5 && hour < 8) {
    timeOfDay = 'dawn';
  } else if (hour >= 8 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 14) {
    timeOfDay = 'noon';
  } else if (hour >= 14 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 20) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }
  
  // 判断是否为白天
  const isDaylight = hour >= 6 && hour < 18;
  
  // 检查特殊日期
  const specialDate = checkSpecialDate(date);
  
  return {
    timestamp: date,
    timeZone,
    isDaylight,
    timeOfDay,
    specialDate
  };
};

/**
 * 检查特殊日期
 * @param {Date} date - 日期
 * @returns {string|null} 特殊日期名称
 */
const checkSpecialDate = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 简单的特殊日期检查
  if (month === 1 && day === 1) return 'New Year';
  if (month === 12 && day === 25) return 'Christmas';
  
  return null;
};
