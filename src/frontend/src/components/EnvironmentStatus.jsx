import React from 'react';
import { useSelector } from 'react-redux';

const EnvironmentStatus = () => {
  const { environmentData, isReady, error } = useSelector(state => state.environment);
  
  // 格式化位置信息
  const formatLocation = () => {
    if (!environmentData || !environmentData.location) {
      return '位置未知';
    }
    
    const { latitude, longitude } = environmentData.location;
    return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  };
  
  // 格式化时间信息
  const formatTime = () => {
    if (!environmentData || !environmentData.timestamp) {
      return '时间未知';
    }
    
    const date = new Date(environmentData.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-2 rounded-lg text-xs text-center">
        无法获取环境数据: {error}
      </div>
    );
  }
  
  if (!isReady) {
    return (
      <div className="bg-neutral bg-opacity-10 p-2 rounded-lg text-xs text-center animate-pulse">
        正在获取环境数据...
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm p-2 rounded-lg text-xs flex justify-around">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{formatLocation()}</span>
      </div>
      
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatTime()}</span>
      </div>
    </div>
  );
};

export default EnvironmentStatus;
