import React, { useState, useEffect } from 'react';

const RecordingTips = () => {
  const [currentTip, setCurrentTip] = useState(0);
  
  // 录音提示列表
  const tips = [
    '描述你看到的景色',
    '分享你此刻的感受',
    '讲述一个简短的故事',
    '描述你想象中的场景',
    '说出你喜欢的颜色和形状',
    '描述一个美好的回忆',
    '表达你对某件事的看法',
    '描述你梦想中的地方',
    '说出你现在的心情',
    '描述你最喜欢的季节'
  ];
  
  // 定期切换提示
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [tips.length]);
  
  return (
    <div className="text-center animate-pulse">
      <p className="text-sm text-neutral text-opacity-60 italic">
        "{tips[currentTip]}"
      </p>
    </div>
  );
};

export default RecordingTips;
