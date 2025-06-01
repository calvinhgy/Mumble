import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import RecordButton from '../components/RecordButton';
import EnvironmentStatus from '../components/EnvironmentStatus';
import OnboardingGuide from '../components/OnboardingGuide';
import ProcessingOverlay from '../components/ProcessingOverlay';
import ImageResult from '../components/ImageResult';
import ErrorMessage from '../components/ErrorMessage';
import RecordingTips from '../components/RecordingTips';
import { resetRecording } from '../store/recordingSlice';
import { collectEnvironmentData } from '../store/environmentSlice';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useEnvironmentData from '../hooks/useEnvironmentData';

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // 从Redux获取状态
  const { isFirstTime } = useSelector(state => state.app);
  const { isProcessing, generatedImageId, generatedImageUrl, error: recordingError } = useSelector(state => state.recording);
  const { isReady: isEnvironmentReady, error: environmentError } = useSelector(state => state.environment);
  
  // 本地状态
  const [showResult, setShowResult] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('processing_audio');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showError, setShowError] = useState(false);
  
  // 使用自定义钩子
  const audioRecorder = useAudioRecorder();
  const environmentData = useEnvironmentData();
  
  // 处理进度模拟
  useEffect(() => {
    let progressInterval;
    
    if (isProcessing) {
      let progress = 0;
      
      progressInterval = setInterval(() => {
        progress += 2;
        
        // 更新处理状态
        if (progress < 30) {
          setProcessingStatus('processing_audio');
        } else if (progress < 60) {
          setProcessingStatus('analyzing_content');
        } else if (progress < 90) {
          setProcessingStatus('generating_image');
        } else {
          setProcessingStatus('finalizing');
        }
        
        setProcessingProgress(Math.min(progress, 95));
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 300);
    } else {
      setProcessingProgress(0);
    }
    
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isProcessing]);
  
  // 当生成图片完成时，显示结果
  useEffect(() => {
    if (generatedImageId && generatedImageUrl) {
      setProcessingProgress(100);
      
      // 短暂延迟以完成进度条
      const timer = setTimeout(() => {
        setShowResult(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [generatedImageId, generatedImageUrl]);
  
  // 处理错误显示
  useEffect(() => {
    if (recordingError || environmentError) {
      setShowError(true);
    }
  }, [recordingError, environmentError]);
  
  // 首次使用时收集环境数据
  useEffect(() => {
    if (!isEnvironmentReady) {
      dispatch(collectEnvironmentData());
    }
  }, [dispatch, isEnvironmentReady]);
  
  // 处理结果关闭
  const handleResultClose = () => {
    setShowResult(false);
    dispatch(resetRecording());
  };
  
  // 处理错误关闭
  const handleErrorClose = () => {
    setShowError(false);
    dispatch(resetRecording());
  };
  
  // 处理错误重试
  const handleErrorRetry = () => {
    setShowError(false);
    dispatch(resetRecording());
    dispatch(collectEnvironmentData());
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Mumble" />
      
      <main className="flex-1 flex flex-col">
        {/* 首次使用引导 */}
        {isFirstTime && <OnboardingGuide />}
        
        {/* 处理中覆盖层 */}
        {isProcessing && !showResult && (
          <ProcessingOverlay 
            status={processingStatus}
            progress={processingProgress}
          />
        )}
        
        {/* 结果展示 */}
        {showResult && generatedImageUrl && (
          <ImageResult 
            imageId={generatedImageId}
            imageUrl={generatedImageUrl}
            onClose={handleResultClose}
          />
        )}
        
        {/* 错误消息 */}
        {showError && (
          <ErrorMessage 
            error={recordingError || environmentError}
            onRetry={handleErrorRetry}
            onCancel={handleErrorClose}
          />
        )}
        
        {/* 中央录音按钮 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <RecordButton />
          
          {/* 录音提示 */}
          <div className="mt-8">
            <RecordingTips />
          </div>
        </div>
        
        {/* 底部环境状态 */}
        <div className="p-4">
          <EnvironmentStatus />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
