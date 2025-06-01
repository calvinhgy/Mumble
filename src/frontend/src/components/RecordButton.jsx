import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startRecording, stopRecording, processRecording } from '../store/recordingSlice';
import { collectEnvironmentData } from '../store/environmentSlice';
import AudioVisualizer from './AudioVisualizer';

const RecordButton = () => {
  const dispatch = useDispatch();
  const { isRecording, isProcessing, error } = useSelector(state => state.recording);
  const { isReady: isEnvironmentReady } = useSelector(state => state.environment);
  
  const [touchStartY, setTouchStartY] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  
  // 收集环境数据
  useEffect(() => {
    dispatch(collectEnvironmentData());
  }, [dispatch]);
  
  // 处理录音计时
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
      setRecordingInterval(interval);
    } else {
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setRecordingDuration(0);
    }
    
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [isRecording, recordingInterval]);
  
  // 处理按下按钮
  const handleTouchStart = useCallback((e) => {
    if (isRecording || isProcessing || !isEnvironmentReady) return;
    
    setTouchStartY(e.touches[0].clientY);
    setIsCancelling(false);
    dispatch(startRecording());
  }, [dispatch, isRecording, isProcessing, isEnvironmentReady]);
  
  // 处理手指移动
  const handleTouchMove = useCallback((e) => {
    if (!isRecording || !touchStartY) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    
    // 如果向上滑动超过50像素，标记为取消
    if (diff < -50) {
      setIsCancelling(true);
    } else {
      setIsCancelling(false);
    }
  }, [isRecording, touchStartY]);
  
  // 处理释放按钮
  const handleTouchEnd = useCallback(async () => {
    if (!isRecording) return;
    
    setTouchStartY(null);
    
    if (isCancelling) {
      // 取消录音
      setIsCancelling(false);
      dispatch(stopRecording());
    } else if (recordingDuration < 0.5) {
      // 录音时间过短
      dispatch(stopRecording());
      // 显示提示
    } else {
      // 停止录音并处理
      await dispatch(stopRecording());
      dispatch(processRecording());
    }
  }, [dispatch, isRecording, isCancelling, recordingDuration]);
  
  return (
    <div className="flex flex-col items-center">
      {/* 录音时长显示 */}
      {isRecording && (
        <div className="mb-4 text-lg font-medium">
          {recordingDuration.toFixed(1)}s
        </div>
      )}
      
      {/* 取消提示 */}
      {isCancelling && (
        <div className="mb-4 text-secondary font-medium">
          上滑取消录音
        </div>
      )}
      
      {/* 主按钮 */}
      <button
        className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all transform ${
          isRecording 
            ? 'bg-secondary scale-110 animate-pulse-recording' 
            : 'bg-primary hover:bg-opacity-90 active:scale-95'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        disabled={isProcessing || !isEnvironmentReady}
      >
        <span className="text-white text-4xl font-display font-bold">M</span>
      </button>
      
      {/* 音量可视化 */}
      {isRecording && <AudioVisualizer />}
      
      {/* 状态提示 */}
      <div className="mt-4 text-center">
        {isProcessing ? (
          <div className="text-neutral">生成中...</div>
        ) : isEnvironmentReady ? (
          <div className="text-neutral">按住开始录音</div>
        ) : (
          <div className="text-neutral">正在准备环境数据...</div>
        )}
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default RecordButton;
