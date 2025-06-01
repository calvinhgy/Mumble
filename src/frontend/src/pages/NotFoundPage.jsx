import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header title="页面未找到" showBackButton={true} />
      
      <div className="flex flex-col items-center justify-center p-8 text-center h-[70vh]">
        <div className="text-6xl mb-6">🤔</div>
        <h2 className="text-2xl font-bold mb-2">页面未找到</h2>
        <p className="text-neutral text-opacity-70 mb-8">
          您访问的页面不存在或已被移除
        </p>
        <Link to="/" className="btn-primary">
          返回首页
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
