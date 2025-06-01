import React from 'react';
import { Link } from 'react-router-dom';

const ImageCard = ({ image }) => {
  // 格式化创建时间
  const formatCreatedAt = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <Link to={`/gallery/${image.imageId}`} className="block">
      <div className="card hover:shadow-lg transition-shadow duration-300">
        <div className="aspect-square overflow-hidden rounded-lg mb-2">
          <img 
            src={image.thumbnailUrl} 
            alt="Generated artwork" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex justify-between items-center text-xs text-neutral">
          <span>{formatCreatedAt(image.createdAt)}</span>
          <span>{image.location}</span>
        </div>
      </div>
    </Link>
  );
};

export default ImageCard;
