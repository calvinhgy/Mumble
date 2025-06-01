import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import ImageGrid from '../components/ImageGrid';
import FilterBar from '../components/FilterBar';
import EmptyState from '../components/EmptyState';
import { fetchGallery } from '../store/gallerySlice';

const GalleryPage = () => {
  const dispatch = useDispatch();
  const { images, total, hasMore, isLoading, error } = useSelector(state => state.gallery);
  
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [offset, setOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 20;
  
  // 初始加载
  useEffect(() => {
    dispatch(fetchGallery({ limit, offset, sortBy, order }));
  }, [dispatch, limit, offset, sortBy, order]);
  
  // 处理排序变化
  const handleSortChange = useCallback((newSortBy, newOrder) => {
    setSortBy(newSortBy);
    setOrder(newOrder || 'desc');
    setOffset(0);
    setIsRefreshing(true);
  }, []);
  
  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setOffset(offset + limit);
    }
  }, [hasMore, isLoading, offset, limit]);
  
  // 下拉刷新
  const handleRefresh = useCallback(() => {
    setOffset(0);
    setIsRefreshing(true);
    dispatch(fetchGallery({ limit, offset: 0, sortBy, order }))
      .finally(() => setIsRefreshing(false));
  }, [dispatch, limit, sortBy, order]);
  
  // 处理滚动加载
  const handleScroll = useCallback((e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    
    // 当滚动到距离底部100px时加载更多
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoading) {
      handleLoadMore();
    }
  }, [hasMore, isLoading, handleLoadMore]);
  
  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      onScroll={handleScroll}
    >
      <Header title="图库" showBackButton={true} showGalleryButton={false} />
      
      {/* 排序选项 */}
      <FilterBar 
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
      />
      
      {/* 下拉刷新指示器 */}
      {isRefreshing && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* 图片网格或空状态 */}
      {total === 0 && !isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState type="gallery" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState type="error" onAction={handleRefresh} />
        </div>
      ) : (
        <div className="flex-1">
          <ImageGrid 
            images={images} 
            isLoading={isLoading && offset === 0} 
            error={error} 
          />
          
          {/* 加载更多指示器 */}
          {isLoading && offset > 0 && (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              <p className="text-sm text-neutral text-opacity-60 mt-2">加载更多...</p>
            </div>
          )}
          
          {/* 加载更多按钮 */}
          {hasMore && !isLoading && (
            <div className="p-4 text-center">
              <button 
                className="btn-secondary"
                onClick={handleLoadMore}
              >
                加载更多
              </button>
            </div>
          )}
          
          {/* 总数显示 */}
          {total > 0 && (
            <div className="p-4 text-center text-sm text-neutral text-opacity-70">
              共 {total} 张图片
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
