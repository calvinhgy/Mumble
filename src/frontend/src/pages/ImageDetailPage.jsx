import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import { fetchImageDetails, deleteImage, exportImage } from '../store/gallerySlice';
import { formatTime, getTimeOfDayLabel } from '../utils/time';
import { formatCoordinate } from '../utils/geolocation';

const ImageDetailPage = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentImage, isLoading, error } = useSelector(state => state.gallery);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  useEffect(() => {
    if (imageId) {
      dispatch(fetchImageDetails(imageId));
    }
  }, [dispatch, imageId]);
  
  const handleBack = () => {
    navigate('/gallery');
  };
  
  const handleShare = async () => {
    if (!currentImage) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mumble生成的图片',
          text: currentImage.audioText || '我的创意图片',
          url: window.location.href
        });
      } else {
        // 复制链接到剪贴板
        await navigator.clipboard.writeText(window.location.href);
        // 显示提示
        alert('链接已复制到剪贴板');
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };
  
  const handleExport = async () => {
    if (!currentImage || isExporting) return;
    
    setIsExporting(true);
    
    try {
      const result = await dispatch(exportImage({
        imageId: currentImage.imageId,
        format: 'jpg',
        quality: 90
      }));
      
      if (result.payload) {
        // 创建下载链接
        const url = URL.createObjectURL(result.payload);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mumble-${currentImage.imageId}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!currentImage || isDeleting) return;
    
    const confirmed = window.confirm('确定要删除这张图片吗？此操作无法撤销。');
    if (!confirmed) return;
    
    setIsDeleting(true);
    
    try {
      await dispatch(deleteImage(currentImage.imageId));
      navigate('/gallery');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请稍后重试');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleImageLoad = () => {
    // 图片加载完成后的处理
  };
  
  const handleImageError = () => {
    console.error('图片加载失败');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (error || !currentImage) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header title="图片详情" showBackButton={true} onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || '图片不存在'}</p>
            <button 
              className="btn-primary"
              onClick={handleBack}
            >
              返回图库
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="图片详情" 
        showBackButton={true} 
        onBack={handleBack}
        rightAction={
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setShowActions(!showActions)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        }
      />
      
      {/* 操作菜单 */}
      {showActions && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg z-50 min-w-32">
          <button
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center"
            onClick={handleShare}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            分享
          </button>
          <button
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center"
            onClick={handleExport}
            disabled={isExporting}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isExporting ? '导出中...' : '导出'}
          </button>
          <button
            className="w-full px-4 py-3 text-left hover:bg-gray-50 text-red-500 flex items-center"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting ? '删除中...' : '删除'}
          </button>
        </div>
      )}
      
      {/* 点击其他地方关闭菜单 */}
      {showActions && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowActions(false)}
        />
      )}
      
      {/* 图片展示 */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={currentImage.imageUrl}
            alt="Generated artwork"
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
        
        {/* 图片信息 */}
        <div className="bg-white border-t border-gray-200 p-4">
          {/* 创建时间 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">创建时间</h3>
            <p className="text-base">
              {formatTime(currentImage.createdAt)} 
              {currentImage.environment?.time?.timeOfDay && (
                <span className="text-gray-500 ml-2">
                  ({getTimeOfDayLabel(currentImage.environment.time.timeOfDay)})
                </span>
              )}
            </p>
          </div>
          
          {/* 位置信息 */}
          {currentImage.environment?.location && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">位置</h3>
              <p className="text-base">
                {currentImage.environment.location.placeName}
                {currentImage.environment.location.country && 
                  `, ${currentImage.environment.location.country}`
                }
              </p>
            </div>
          )}
          
          {/* 天气信息 */}
          {currentImage.environment?.weather && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">天气</h3>
              <p className="text-base">
                {currentImage.environment.weather.condition}
                {currentImage.environment.weather.temperature && 
                  `, ${currentImage.environment.weather.temperature}°C`
                }
              </p>
            </div>
          )}
          
          {/* 原始录音文本 */}
          {currentImage.audioText && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">录音内容</h3>
              <p className="text-base italic text-gray-700">
                "{currentImage.audioText}"
              </p>
            </div>
          )}
          
          {/* AI提示词 */}
          {currentImage.prompt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">AI提示词</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {currentImage.prompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageDetailPage;
