import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * 环境数据钩子
 * 收集和处理环境数据（位置、天气、时间等）
 */
const useEnvironmentData = () => {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [timeData, setTimeData] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  const { preferences } = useSelector(state => state.app);
  const locationPrecision = preferences?.privacySettings?.locationPrecision || 'city';

  // 收集环境数据
  const collectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 收集位置数据
      if (locationPrecision !== 'none') {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: locationPrecision === 'exact',
              timeout: 10000,
              maximumAge: 60000
            });
          });
          
          const { latitude, longitude, accuracy } = position.coords;
          
          // 根据精度设置处理坐标
          let processedLocation;
          if (locationPrecision === 'city') {
            // 降低精度到城市级别（保留小数点后两位）
            processedLocation = {
              latitude: Math.round(latitude * 100) / 100,
              longitude: Math.round(longitude * 100) / 100,
              accuracy
            };
          } else {
            processedLocation = { latitude, longitude, accuracy };
          }
          
          setLocation(processedLocation);
        } catch (err) {
          console.warn('位置获取失败:', err);
          setError('无法获取位置信息');
          // 使用默认位置
          setLocation({ latitude: 0, longitude: 0, accuracy: 1000 });
        }
      } else {
        // 用户选择不使用位置
        setLocation({ latitude: 0, longitude: 0, accuracy: 1000 });
      }
      
      // 收集设备数据
      const device = {
        orientation: window.screen.orientation.type,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      };
      
      // 尝试获取电池信息
      try {
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery();
          device.batteryLevel = battery.level;
          device.batteryCharging = battery.charging;
        }
      } catch (e) {
        console.log('电池信息不可用');
      }
      
      setDeviceData(device);
      
      // 设置时间数据
      const now = new Date();
      const hour = now.getHours();
      
      // 获取一天中的时段
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
      
      setTimeData({
        timestamp: now.toISOString(),
        timeOfDay,
        isDaylight: hour >= 6 && hour < 18
      });
      
      setIsReady(true);
    } catch (err) {
      console.error('环境数据收集失败:', err);
      setError(err.message || '环境数据收集失败');
    } finally {
      setIsLoading(false);
    }
  }, [locationPrecision]);

  // 组件挂载时收集数据
  useEffect(() => {
    collectData();
  }, [collectData]);

  // 组合所有环境数据
  const environmentData = {
    location,
    device: deviceData,
    timestamp: timeData?.timestamp
  };

  return {
    environmentData,
    isLoading,
    isReady,
    error,
    refreshData: collectData
  };
};

export default useEnvironmentData;
