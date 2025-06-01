import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'mumble_device_id';
const PREFERENCES_KEY = 'mumble_preferences';

/**
 * 获取设备ID，如果不存在则创建
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
};

/**
 * 获取存储的用户偏好设置
 */
export const getStoredPreferences = () => {
  const preferencesJson = localStorage.getItem(PREFERENCES_KEY);
  
  if (preferencesJson) {
    try {
      return JSON.parse(preferencesJson);
    } catch (error) {
      console.error('Failed to parse stored preferences:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * 存储用户偏好设置
 */
export const storePreferences = (preferences) => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Failed to store preferences:', error);
    return false;
  }
};

/**
 * 清除所有存储的数据
 */
export const clearStorage = () => {
  localStorage.removeItem(PREFERENCES_KEY);
  // 不清除设备ID，保持用户身份
};

/**
 * 存储图片到IndexedDB缓存
 */
export const cacheImage = async (imageId, imageBlob) => {
  // 实现IndexedDB缓存逻辑
};

/**
 * 从IndexedDB缓存获取图片
 */
export const getCachedImage = async (imageId) => {
  // 实现IndexedDB获取逻辑
};
