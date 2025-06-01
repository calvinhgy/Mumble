import { useState, useEffect, useCallback } from 'react';

/**
 * 音频录制钩子
 * 提供录音功能和音频可视化数据
 */
const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [error, setError] = useState(null);
  const [visualizationData, setVisualizationData] = useState(new Uint8Array());
  const [analyser, setAnalyser] = useState(null);
  const [audioContext, setAudioContext] = useState(null);

  // 清理函数
  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    setStream(null);
    setMediaRecorder(null);
    setAudioChunks([]);
    setAnalyser(null);
    setAudioContext(null);
  }, [stream, audioContext]);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // 获取麦克风权限
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      // 创建音频上下文和分析器
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const audioAnalyser = context.createAnalyser();
      audioAnalyser.fftSize = 256;
      
      // 连接音频源到分析器
      const source = context.createMediaStreamSource(audioStream);
      source.connect(audioAnalyser);
      
      setAudioContext(context);
      setAnalyser(audioAnalyser);
      
      // 创建媒体录制器
      const recorder = new MediaRecorder(audioStream);
      setMediaRecorder(recorder);
      
      // 收集音频数据
      const chunks = [];
      recorder.addEventListener('dataavailable', e => {
        chunks.push(e.data);
      });
      
      // 录音结束处理
      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setDuration((Date.now() - startTime) / 1000);
        setIsRecording(false);
      });
      
      // 开始录音
      recorder.start();
      setAudioChunks(chunks);
      setStartTime(Date.now());
      setIsRecording(true);
      
      // 开始音频可视化
      visualize(audioAnalyser);
    } catch (err) {
      console.error('录音失败:', err);
      setError(err.message || '无法访问麦克风');
      cleanup();
    }
  }, [cleanup]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  // 取消录音
  const cancelRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setAudioBlob(null);
    setDuration(0);
    cleanup();
  }, [mediaRecorder, cleanup]);

  // 音频可视化
  const visualize = useCallback((analyser) => {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVisualization = () => {
      if (!analyser) return;
      
      analyser.getByteFrequencyData(dataArray);
      setVisualizationData(dataArray);
      
      if (isRecording) {
        requestAnimationFrame(updateVisualization);
      }
    };
    
    updateVisualization();
  }, [isRecording]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
    visualizationData,
    stream
  };
};

export default useAudioRecorder;
