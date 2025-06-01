import React from 'react';

const FilterBar = ({ sortBy, order, onSortChange }) => {
  // 处理排序变化
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // 切换排序方向
      onSortChange(sortBy, order === 'desc' ? 'asc' : 'desc');
    } else {
      // 切换排序字段，默认降序
      onSortChange(newSortBy, 'desc');
    }
  };
  
  return (
    <div className="bg-white shadow-sm">
      <div className="flex justify-around p-2">
        <button 
          className={`px-3 py-1 rounded-full text-sm ${
            sortBy === 'createdAt' ? 'bg-primary text-white' : 'bg-neutral bg-opacity-10'
          }`}
          onClick={() => handleSortChange('createdAt')}
        >
          {order === 'desc' && sortBy === 'createdAt' ? '最新' : '最早'}
        </button>
        
        <button 
          className={`px-3 py-1 rounded-full text-sm ${
            sortBy === 'location' ? 'bg-primary text-white' : 'bg-neutral bg-opacity-10'
          }`}
          onClick={() => handleSortChange('location')}
        >
          按位置
        </button>
        
        <button 
          className={`px-3 py-1 rounded-full text-sm ${
            sortBy === 'style' ? 'bg-primary text-white' : 'bg-neutral bg-opacity-10'
          }`}
          onClick={() => handleSortChange('style')}
        >
          按风格
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
