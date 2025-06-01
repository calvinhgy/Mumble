import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setFirstTimeCompleted } from '../store/appSlice';

const OnboardingGuide = () => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  
  // 引导步骤内容
  const steps = [
    {
      title: '欢迎使用Mumble',
      description: 'Mumble将你的语音转化为独特的艺术作品。让我们一起了解如何使用吧！',
      image: '/onboarding/welcome.svg',
    },
    {
      title: '按住M按钮',
      description: '按住主页上的M按钮，开始录制你的声音。可以是任何想法、感受或描述。',
      image: '/onboarding/record.svg',
    },
    {
      title: '释放按钮',
      description: '当你说完后，释放按钮。Mumble会捕捉你的语音和当前环境。',
      image: '/onboarding/release.svg',
    },
    {
      title: '生成艺术',
      description: 'Mumble会根据你的语音和环境，创建一幅独特的艺术作品。',
      image: '/onboarding/generate.svg',
    },
    {
      title: '查看图库',
      description: '所有创作都会保存在你的图库中。你可以查看、分享或导出它们。',
      image: '/onboarding/gallery.svg',
    }
  ];
  
  // 处理下一步
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成引导
      dispatch(setFirstTimeCompleted());
    }
  };
  
  // 处理跳过
  const handleSkip = () => {
    dispatch(setFirstTimeCompleted());
  };
  
  const currentStepData = steps[currentStep];
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 进度指示器 */}
      <div className="flex justify-center mt-6">
        {steps.map((_, index) => (
          <div 
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentStep ? 'bg-primary' : 'bg-neutral bg-opacity-20'
            }`}
          />
        ))}
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-64 h-64 mb-8">
          <img 
            src={currentStepData.image} 
            alt={currentStepData.title}
            className="w-full h-full object-contain"
          />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">{currentStepData.title}</h2>
        <p className="text-center text-neutral text-opacity-80 mb-8">
          {currentStepData.description}
        </p>
      </div>
      
      {/* 按钮区域 */}
      <div className="p-6">
        <button 
          className="btn-primary w-full mb-4"
          onClick={handleNext}
        >
          {currentStep < steps.length - 1 ? '下一步' : '开始使用'}
        </button>
        
        {currentStep < steps.length - 1 && (
          <button 
            className="text-neutral text-opacity-60 w-full py-2"
            onClick={handleSkip}
          >
            跳过引导
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingGuide;
