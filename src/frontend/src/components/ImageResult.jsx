import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ImageResult = ({ imageId, imageUrl, onClose }) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(true);
  
  // 处理动画结束
  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };
  
  // 处理查看详情
  const handleViewDetails = () => {
    navigate(`/gallery/${imageId}`);
    if (onClose) onClose();
  };
  
  // 处理继续创作
  const handleContinue = () => {
    if (onClose) onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div 
        className={`bg-white rounded-xl max-w-xs w-full overflow-hidden transform transition-all duration-500 ${
          isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* 图像展示 */}
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Generated artwork" 
            className="w-full h-auto"
            onLoad={() => setIsAnimating(false)}
          />
          
          {/* 成功标记 */}
          <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        {/* 文本和按钮 */}
        <div className="p-4 text-center">
          <h3 className="text-lg font-medium mb-2">创作完成！</h3>
          <p className="text-sm text-neutral text-opacity-70 mb-4">
            你的语音已转化为独特的艺术作品
          </p>
          
          <div className="flex space-x-2">
            <button 
              className="flex-1 py-2 border border-primary text-primary rounded-lg"
              onClick={handleContinue}
            >
              继续创作
            </button>
            <button 
              className="flex-1 py-2 bg-primary text-white rounded-lg"
              onClick={handleViewDetails}
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageResult;
