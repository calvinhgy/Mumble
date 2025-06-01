import React from 'react';

const ErrorMessage = ({ error, onRetry, onCancel }) => {
  // 处理错误消息
  const getErrorMessage = () => {
    if (!error) return '发生未知错误';
    
    // 处理常见错误类型
    if (error.includes('permission')) {
      return '无法访问麦克风，请检查权限设置';
    } else if (error.includes('network')) {
      return '网络连接错误，请检查网络连接';
    } else if (error.includes('timeout')) {
      return '请求超时，请稍后重试';
    } else if (error.includes('location')) {
      return '无法获取位置信息，请检查位置权限';
    } else if (error.includes('generation')) {
      return '图像生成失败，请重试';
    }
    
    return error;
  };
  
  // 处理错误图标
  const getErrorIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-xs w-full text-center">
        {getErrorIcon()}
        
        <h3 className="text-lg font-medium mb-2">出错了</h3>
        
        <p className="text-sm text-neutral text-opacity-70 mb-6">
          {getErrorMessage()}
        </p>
        
        <div className="flex space-x-2">
          {onCancel && (
            <button 
              className="flex-1 py-2 border border-neutral border-opacity-20 rounded-lg"
              onClick={onCancel}
            >
              取消
            </button>
          )}
          
          {onRetry && (
            <button 
              className="flex-1 py-2 bg-primary text-white rounded-lg"
              onClick={onRetry}
            >
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
