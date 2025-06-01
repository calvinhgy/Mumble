import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ type = 'gallery', onAction }) => {
  // 根据类型获取内容
  const getContent = () => {
    switch (type) {
      case 'gallery':
        return {
          icon: '🖼️',
          title: '暂无图片',
          description: '按下主页上的"M"按钮，开始创建你的第一张图片',
          actionText: '开始创作',
          actionLink: '/'
        };
      case 'search':
        return {
          icon: '🔍',
          title: '无搜索结果',
          description: '尝试使用不同的关键词或筛选条件',
          actionText: '清除筛选',
          actionHandler: onAction
        };
      case 'error':
        return {
          icon: '😕',
          title: '加载失败',
          description: '无法加载内容，请检查网络连接后重试',
          actionText: '重试',
          actionHandler: onAction
        };
      default:
        return {
          icon: '📭',
          title: '暂无内容',
          description: '这里还没有任何内容',
          actionText: '返回首页',
          actionLink: '/'
        };
    }
  };
  
  const content = getContent();
  
  return (
    <div className="p-8 text-center">
      <div className="text-6xl mb-4">{content.icon}</div>
      <h3 className="text-xl font-medium mb-2">{content.title}</h3>
      <p className="text-neutral text-opacity-70 mb-6">
        {content.description}
      </p>
      
      {content.actionLink ? (
        <Link to={content.actionLink} className="btn-primary">
          {content.actionText}
        </Link>
      ) : content.actionHandler ? (
        <button 
          className="btn-primary"
          onClick={content.actionHandler}
        >
          {content.actionText}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;
