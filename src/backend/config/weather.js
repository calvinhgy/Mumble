const axios = require('axios');

// OpenWeatherMap API配置
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_API_BASE_URL = 'https://api.openweathermap.org/geo/1.0';

/**
 * 检查天气API连接
 */
const checkWeatherAPIConnection = async () => {
  try {
    if (!WEATHER_API_KEY) {
      return {
        status: 'error',
        error: 'Weather API key not configured'
      };
    }
    
    // 测试API连接（使用北京的坐标）
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat: 39.9042,
        lon: 116.4074,
        appid: WEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 5000
    });
    
    return {
      status: 'connected',
      city: response.data.name
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
};

/**
 * 根据坐标获取天气信息
 * @param {number} lat 纬度
 * @param {number} lon 经度
 * @returns {Promise<Object>} 天气信息
 */
const getWeatherByCoordinates = async (lat, lon) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }
    
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      },
      timeout: 10000
    });
    
    const data = response.data;
    
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      },
      weather: {
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null
      },
      wind: {
        speed: data.wind.speed,
        direction: data.wind.deg,
        gust: data.wind.gust
      },
      clouds: {
        coverage: data.clouds.all
      },
      sun: {
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000)
      },
      timestamp: new Date(data.dt * 1000)
    };
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error(`Failed to get weather data: ${error.message}`);
  }
};

/**
 * 根据城市名获取天气信息
 * @param {string} cityName 城市名
 * @returns {Promise<Object>} 天气信息
 */
const getWeatherByCity = async (cityName) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }
    
    const response = await axios.get(`${WEATHER_API_BASE_URL}/weather`, {
      params: {
        q: cityName,
        appid: WEATHER_API_KEY,
        units: 'metric',
        lang: 'zh_cn'
      },
      timeout: 10000
    });
    
    const data = response.data;
    
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      },
      weather: {
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null
      },
      wind: {
        speed: data.wind.speed,
        direction: data.wind.deg,
        gust: data.wind.gust
      },
      clouds: {
        coverage: data.clouds.all
      },
      sun: {
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000)
      },
      timestamp: new Date(data.dt * 1000)
    };
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error(`Failed to get weather data: ${error.message}`);
  }
};

/**
 * 根据坐标获取地理位置信息
 * @param {number} lat 纬度
 * @param {number} lon 经度
 * @returns {Promise<Object>} 地理位置信息
 */
const getLocationByCoordinates = async (lat, lon) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }
    
    const response = await axios.get(`${GEO_API_BASE_URL}/reverse`, {
      params: {
        lat,
        lon,
        limit: 1,
        appid: WEATHER_API_KEY
      },
      timeout: 10000
    });
    
    const data = response.data[0];
    
    if (!data) {
      throw new Error('Location not found');
    }
    
    return {
      name: data.name,
      localNames: data.local_names,
      country: data.country,
      state: data.state,
      coordinates: {
        lat: data.lat,
        lon: data.lon
      }
    };
  } catch (error) {
    console.error('Geocoding API error:', error);
    throw new Error(`Failed to get location data: ${error.message}`);
  }
};

/**
 * 根据城市名获取坐标
 * @param {string} cityName 城市名
 * @returns {Promise<Array>} 坐标列表
 */
const getCoordinatesByCity = async (cityName) => {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }
    
    const response = await axios.get(`${GEO_API_BASE_URL}/direct`, {
      params: {
        q: cityName,
        limit: 5,
        appid: WEATHER_API_KEY
      },
      timeout: 10000
    });
    
    return response.data.map(location => ({
      name: location.name,
      localNames: location.local_names,
      country: location.country,
      state: location.state,
      coordinates: {
        lat: location.lat,
        lon: location.lon
      }
    }));
  } catch (error) {
    console.error('Geocoding API error:', error);
    throw new Error(`Failed to get coordinates: ${error.message}`);
  }
};

/**
 * 获取天气图标URL
 * @param {string} iconCode 图标代码
 * @returns {string} 图标URL
 */
const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

/**
 * 将天气状况转换为中文
 * @param {string} condition 天气状况
 * @returns {string} 中文描述
 */
const translateWeatherCondition = (condition) => {
  const translations = {
    'Clear': '晴朗',
    'Clouds': '多云',
    'Rain': '雨',
    'Drizzle': '毛毛雨',
    'Thunderstorm': '雷暴',
    'Snow': '雪',
    'Mist': '薄雾',
    'Smoke': '烟雾',
    'Haze': '霾',
    'Dust': '沙尘',
    'Fog': '雾',
    'Sand': '沙',
    'Ash': '火山灰',
    'Squall': '飑',
    'Tornado': '龙卷风'
  };
  
  return translations[condition] || condition;
};

/**
 * 根据风向角度获取风向描述
 * @param {number} degrees 风向角度
 * @returns {string} 风向描述
 */
const getWindDirection = (degrees) => {
  const directions = [
    '北', '北东北', '东北', '东东北',
    '东', '东东南', '东南', '南东南',
    '南', '南西南', '西南', '西西南',
    '西', '西西北', '西北', '北西北'
  ];
  
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

module.exports = {
  checkWeatherAPIConnection,
  getWeatherByCoordinates,
  getWeatherByCity,
  getLocationByCoordinates,
  getCoordinatesByCity,
  getWeatherIconUrl,
  translateWeatherCondition,
  getWindDirection
};
