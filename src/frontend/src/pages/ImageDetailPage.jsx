import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../components/Header';
import { fetchImageDetails, deleteImage, exportImage } from '../store/gallerySlice';
import ErrorMessage from '../components/ErrorMessage';

const ImageDetailPage = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentImage, isLoading, isExporting, error } = useSelector(state => state.gallery);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef(null);
  
  // 加载图片详情
  useEffect(() => {
    if (imageId) {
      dispatch(fetchImageDetails(imageId));
    }
    
    return () => {
      // 重置缩放和平移状态
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    };
  }, [dispatch, imageId]);
  
  // 处理删除
  const handleDelete = () => {
    dispatch(deleteImage(imageId)).then(() => {
      navigate('/gallery');
    });
  };
  
  // 处理导出
  const handleExport = (format = 'jpg', quality = 90) => {
    dispatch(exportImage({ imageId, format, quality }));
    setShowExportOptions(false);
  };
  
  // 处理分享
  const handleShare = async () => {
    try {
      if (navigator.share && currentImage) {
        await navigator.share({
          title: 'Mumble创作',
          text: '查看我用Mumble创作的图片',
          url: window.location.href
        });
      } else {
        // 复制链接
        await navigator.clipboard.writeText(window.location.href);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      }
    } catch (err) {
      console.error('分享失败:', err);
    }
  };
  
  // 处理双击缩放
  const handleDoubleClick = (e) => {
    if (zoomLevel === 1) {
      // 放大到2倍，并将点击位置作为中心
      setZoomLevel(2);
      
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const offsetX = (e.clientX - rect.left) / rect.width;
        const offsetY = (e.clientY - rect.top) / rect.height;
        
        // 计算平移位置，使点击位置居中
        const newPanX = (0.5 - offsetX) * rect.width;
        const newPanY = (0.5 - offsetY) * rect.height;
        
        setPanPosition({ x: newPanX, y: newPanY });
      }
    } else {
      // 重置缩放和平移
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };
  
  // 处理平移开始
  const handlePanStart = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setStartPanPosition({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y
      });
    }
  };
  
  // 处理平移移动
  const handlePanMove = (e) => {
    if (isPanning && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - startPanPosition.x,
        y: e.clientY - startPanPosition.y
      });
    }
  };
  
  // 处理平移结束
  const handlePanEnd = () => {
    setIsPanning(false);
  };
  
  // 格式化创建时间
  const formatCreatedAt = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading || !imageLoaded) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="" showBackButton={true} showGalleryButton={false} />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="错误" showBackButton={true} showGalleryButton={false} />
        <div className="flex-1 flex items-center justify-center">
          <ErrorMessage 
            error={error}
            onRetry={() => dispatch(fetchImageDetails(imageId))}
            onCancel={() => navigate('/gallery')}
          />
        </div>
      </div>
    );
  }
  
  if (!currentImage) {
    return (
      <div className="min-h-screen bg-black">
        <Header title="未找到" showBackButton={true} showGalleryButton={false} />
        <div className="flex flex-col items-center justify-center h-screen text-white p-4">
          <p className="mb-4">未找到图片</p>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/gallery')}
          >
            返回图库
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black">
      <Header title="" showBackButton={true} showGalleryButton={false} />
      
      {/* 图片展示 */}
      <div 
        className="relative overflow-hidden"
        onClick={() => setShowActions(!showActions)}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={(e) => handlePanStart(e.touches[0])}
        onTouchMove={(e) => handlePanMove(e.touches[0])}
        onTouchEnd={handlePanEnd}
      >
        <div 
          ref={imageRef}
          className="transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
            transformOrigin: 'center'
          }}
        >
          <img 
            src={currentImage.imageUrl} 
            alt="Generated artwork" 
            className="w-full h-auto"
            onLoad={() => setImageLoaded(true)}
          />
        </div>
        
        {/* 缩放指示器 */}
        {zoomLevel > 1 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
            {Math.round(zoomLevel * 100)}%
          </div>
        )}
        
        {/* 信息卡片 */}
        <div className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 transition-all duration-300 ${
          showActions ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="mb-2">
            <p className="text-sm opacity-80">{formatCreatedAt(currentImage.createdAt)}</p>
            <p className="text-sm opacity-80">{currentImage.environment?.location?.placeName}</p>
          </div>
          
          {currentImage.audioText && (
            <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg">
              <p className="text-sm italic">"{currentImage.audioText}"</p>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex justify-around mt-4">
            <button 
              className="flex flex-col items-center text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportOptions(!showExportOptions);
              }}
              disabled={isExporting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isExporting ? '导出中...' : '导出'}
            </button>
            
            <button 
              className="flex flex-col items-center text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              分享
            </button>
            
            <button 
              className="flex flex-col items-center text-xs text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
      
      {/* 导出选项对话框 */}
      {showExportOptions && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowExportOptions(false)}
        >
          <div 
            className="bg-white rounded-xl p-4 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">选择导出格式</h3>
            
            <div className="space-y-3">
              <button 
                className="w-full py-3 border border-neutral border-opacity-20 rounded-lg flex items-center justify-between px-4"
                onClick={() => handleExport('jpg', 90)}
              >
                <span>JPG格式 (高质量)</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button 
                className="w-full py-3 border border-neutral border-opacity-20 rounded-lg flex items-center justify-between px-4"
                onClick={() => handleExport('png')}
              >
                <span>PNG格式 (无损)</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <button 
              className="w-full mt-4 py-2 text-neutral"
              onClick={() => setShowExportOptions(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="bg-white rounded-xl p-4 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-2">确认删除</h3>
            <p className="text-neutral text-sm mb-4">
              确定要删除这张图片吗？此操作无法撤销。
            </p>
            <div className="flex justify-end space-x-2">
              <button 
                className="px-4 py-2 text-neutral"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded-lg"
                onClick={handleDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 分享成功提示 */}
      {showShareSuccess && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center">
          <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
            链接已复制到剪贴板
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDetailPage;
