import React from 'react';

const ProcessingOverlay = ({ status, progress, onCancel }) => {
  // 处理状态文本
  const getStatusText = () => {
    switch (status) {
      case 'processing_audio':
        return '正在处理语音...';
      case 'analyzing_content':
        return '正在分析内容...';
      case 'generating_image':
        return '正在创作图像...';
      case 'finalizing':
        return '正在完成...';
      default:
        return '处理中...';
    }
  };
  
  // 处理进度
  const progressPercent = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-xs w-full text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        
        <h3 className="text-lg font-medium mb-2">{getStatusText()}</h3>
        
        {/* 进度条 */}
        <div className="w-full bg-neutral bg-opacity-20 rounded-full h-2.5 mb-4">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-neutral text-opacity-70 mb-6">
          请稍候，我们正在根据你的语音创作独特的艺术作品
        </p>
        
        {onCancel && (
          <button 
            className="text-neutral text-opacity-60 text-sm"
            onClick={onCancel}
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
};

export default ProcessingOverlay;
