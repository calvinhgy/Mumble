import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 404图标 */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white text-6xl font-display font-bold">M</span>
          </div>
        </div>
        
        {/* 错误信息 */}
        <h1 className="text-4xl font-bold text-neutral mb-4">404</h1>
        <h2 className="text-xl font-semibold text-neutral mb-4">页面未找到</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          抱歉，您访问的页面不存在。<br />
          可能是链接错误或页面已被移除。
        </p>
        
        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full btn-primary"
          >
            回到首页
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full btn-secondary"
          >
            返回上页
          </button>
        </div>
        
        {/* 建议链接 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">您可能想要访问：</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/')}
              className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary hover:bg-opacity-10 rounded-md transition-colors"
            >
              🎤 开始录音创作
            </button>
            <button
              onClick={() => navigate('/gallery')}
              className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary hover:bg-opacity-10 rounded-md transition-colors"
            >
              🖼️ 查看图库
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary hover:bg-opacity-10 rounded-md transition-colors"
            >
              ⚙️ 应用设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
