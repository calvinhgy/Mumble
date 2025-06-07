import { STORAGE_KEYS } from '../config/constants';

/**
 * 生成设备ID
 * @returns {string} 设备ID
 */
export const generateDeviceId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
};

/**
 * 获取设备ID
 * @returns {string} 设备ID
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  
  return deviceId;
};

/**
 * 获取设备信息
 * @returns {Object} 设备信息
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const cookieEnabled = navigator.cookieEnabled;
  const onLine = navigator.onLine;
  
  // 检测设备类型
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // 检测操作系统
  let os = 'Unknown';
  if (userAgent.indexOf('Win') !== -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
  else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
  else if (userAgent.indexOf('Android') !== -1) os = 'Android';
  else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) os = 'iOS';
  
  // 检测浏览器
  let browser = 'Unknown';
  if (userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (userAgent.indexOf('Safari') !== -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') !== -1) browser = 'Edge';
  else if (userAgent.indexOf('Opera') !== -1) browser = 'Opera';
  
  // 获取屏幕信息
  const screen = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth
  };
  
  // 获取视口信息
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1
  };
  
  return {
    deviceId: getDeviceId(),
    userAgent,
    platform,
    language,
    cookieEnabled,
    onLine,
    deviceType: {
      isMobile,
      isTablet,
      isDesktop
    },
    os,
    browser,
    screen,
    viewport,
    timestamp: new Date().toISOString()
  };
};

/**
 * 检测设备能力
 * @returns {Object} 设备能力信息
 */
export const getDeviceCapabilities = () => {
  const capabilities = {
    // 音频支持
    audio: {
      supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      mediaRecorder: !!window.MediaRecorder
    },
    
    // 地理位置支持
    geolocation: {
      supported: !!navigator.geolocation
    },
    
    // 存储支持
    storage: {
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      indexedDB: !!window.indexedDB
    },
    
    // 网络支持
    network: {
      online: navigator.onLine,
      connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection
    },
    
    // 触摸支持
    touch: {
      supported: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    },
    
    // 通知支持
    notifications: {
      supported: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'denied'
    },
    
    // 振动支持
    vibration: {
      supported: !!navigator.vibrate
    },
    
    // 全屏支持
    fullscreen: {
      supported: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled)
    }
  };
  
  return capabilities;
};

/**
 * 检测是否为iPhone
 * @returns {boolean}
 */
export const isIPhone = () => {
  return /iPhone/i.test(navigator.userAgent);
};

/**
 * 检测是否为iPad
 * @returns {boolean}
 */
export const isIPad = () => {
  return /iPad/i.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * 检测是否为iOS设备
 * @returns {boolean}
 */
export const isIOS = () => {
  return isIPhone() || isIPad();
};

/**
 * 检测是否为Android设备
 * @returns {boolean}
 */
export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * 检测是否为移动设备
 * @returns {boolean}
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * 获取安全区域信息（用于iPhone X等设备）
 * @returns {Object}
 */
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top')) || 0,
    right: parseInt(style.getPropertyValue('--safe-area-inset-right')) || 0,
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom')) || 0,
    left: parseInt(style.getPropertyValue('--safe-area-inset-left')) || 0
  };
};

/**
 * 检测设备方向
 * @returns {string} portrait | landscape
 */
export const getOrientation = () => {
  if (window.innerHeight > window.innerWidth) {
    return 'portrait';
  } else {
    return 'landscape';
  }
};

/**
 * 监听设备方向变化
 * @param {Function} callback 回调函数
 * @returns {Function} 取消监听的函数
 */
export const onOrientationChange = (callback) => {
  const handleOrientationChange = () => {
    callback(getOrientation());
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
  
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};
