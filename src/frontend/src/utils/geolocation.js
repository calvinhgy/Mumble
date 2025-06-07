import { GEOLOCATION_CONFIG, ERROR_MESSAGES } from '../config/constants';

/**
 * 检查地理位置支持
 * @returns {boolean}
 */
export const checkGeolocationSupport = () => {
  return !!navigator.geolocation;
};

/**
 * 获取当前位置
 * @param {Object} options 配置选项
 * @returns {Promise<Object>} 位置信息
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!checkGeolocationSupport()) {
      reject(new Error(ERROR_MESSAGES.GEOLOCATION_NOT_SUPPORTED));
      return;
    }
    
    const config = {
      enableHighAccuracy: options.enableHighAccuracy ?? GEOLOCATION_CONFIG.ENABLE_HIGH_ACCURACY,
      timeout: options.timeout ?? GEOLOCATION_CONFIG.TIMEOUT,
      maximumAge: options.maximumAge ?? GEOLOCATION_CONFIG.MAXIMUM_AGE
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };
        
        resolve(locationData);
      },
      (error) => {
        let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '地理位置权限被拒绝';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '无法获取地理位置信息';
            break;
          case error.TIMEOUT:
            errorMessage = '获取地理位置超时';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      config
    );
  });
};

/**
 * 监听位置变化
 * @param {Function} callback 回调函数
 * @param {Object} options 配置选项
 * @returns {number} 监听器ID
 */
export const watchPosition = (callback, options = {}) => {
  if (!checkGeolocationSupport()) {
    throw new Error(ERROR_MESSAGES.GEOLOCATION_NOT_SUPPORTED);
  }
  
  const config = {
    enableHighAccuracy: options.enableHighAccuracy ?? GEOLOCATION_CONFIG.ENABLE_HIGH_ACCURACY,
    timeout: options.timeout ?? GEOLOCATION_CONFIG.TIMEOUT,
    maximumAge: options.maximumAge ?? GEOLOCATION_CONFIG.MAXIMUM_AGE
  };
  
  return navigator.geolocation.watchPosition(
    (position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      };
      
      callback(locationData);
    },
    (error) => {
      let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '地理位置权限被拒绝';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '无法获取地理位置信息';
          break;
        case error.TIMEOUT:
          errorMessage = '获取地理位置超时';
          break;
      }
      
      callback(null, new Error(errorMessage));
    },
    config
  );
};

/**
 * 停止监听位置变化
 * @param {number} watchId 监听器ID
 */
export const clearWatch = (watchId) => {
  if (checkGeolocationSupport() && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * 计算两点间距离（米）
 * @param {number} lat1 纬度1
 * @param {number} lon1 经度1
 * @param {number} lat2 纬度2
 * @param {number} lon2 经度2
 * @returns {number} 距离（米）
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * 格式化坐标
 * @param {number} coordinate 坐标值
 * @param {string} type 类型 'lat' | 'lon'
 * @returns {string} 格式化后的坐标
 */
export const formatCoordinate = (coordinate, type) => {
  const abs = Math.abs(coordinate);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = ((abs - degrees - minutes / 60) * 3600).toFixed(2);
  
  let direction;
  if (type === 'lat') {
    direction = coordinate >= 0 ? 'N' : 'S';
  } else {
    direction = coordinate >= 0 ? 'E' : 'W';
  }
  
  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

/**
 * 获取位置精度描述
 * @param {number} accuracy 精度值（米）
 * @returns {string} 精度描述
 */
export const getAccuracyDescription = (accuracy) => {
  if (accuracy <= 5) {
    return '非常精确';
  } else if (accuracy <= 20) {
    return '精确';
  } else if (accuracy <= 100) {
    return '较精确';
  } else if (accuracy <= 1000) {
    return '一般';
  } else {
    return '不精确';
  }
};

/**
 * 检查位置是否有效
 * @param {Object} position 位置对象
 * @returns {boolean} 是否有效
 */
export const isValidPosition = (position) => {
  if (!position || typeof position !== 'object') {
    return false;
  }
  
  const { latitude, longitude } = position;
  
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    !isNaN(latitude) && !isNaN(longitude)
  );
};

/**
 * 获取位置权限状态
 * @returns {Promise<string>} 权限状态
 */
export const getLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'unknown';
  }
  
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state; // 'granted', 'denied', 'prompt'
  } catch (error) {
    return 'unknown';
  }
};

/**
 * 请求位置权限
 * @returns {Promise<boolean>} 是否获得权限
 */
export const requestLocationPermission = async () => {
  try {
    await getCurrentPosition({ timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 生成地图URL
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @param {number} zoom 缩放级别
 * @returns {string} 地图URL
 */
export const generateMapUrl = (latitude, longitude, zoom = 15) => {
  return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
};

/**
 * 获取位置的时区
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @returns {string} 时区
 */
export const getTimezone = (latitude, longitude) => {
  // 这里可以集成时区API，目前返回本地时区
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
