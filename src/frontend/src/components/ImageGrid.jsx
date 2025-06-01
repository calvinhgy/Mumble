import React from 'react';
import ImageCard from './ImageCard';

const ImageGrid = ({ images, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="aspect-square bg-neutral bg-opacity-10 rounded-lg mb-2"></div>
            <div className="h-4 bg-neutral bg-opacity-10 rounded"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">加载失败: {error}</p>
        <button className="btn-secondary mt-4">重试</button>
      </div>
    );
  }
  
  if (!images || images.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-xl font-medium mb-2">暂无图片</h3>
        <p className="text-neutral text-opacity-70 mb-6">
          按下主页上的"M"按钮，开始创建你的第一张图片
        </p>
        <button 
          className="btn-primary"
          onClick={() => window.location.href = '/'}
        >
          开始创作
        </button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {images.map(image => (
        <ImageCard key={image.imageId} image={image} />
      ))}
    </div>
  );
};

export default ImageGrid;
