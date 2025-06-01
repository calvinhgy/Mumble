import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const AudioVisualizer = () => {
  const canvasRef = useRef(null);
  const { stream } = useSelector(state => state.recording);
  
  useEffect(() => {
    if (!stream || !canvasRef.current) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    // 设置画布尺寸
    canvas.width = 200;
    canvas.height = 60;
    
    // 动画函数
    const draw = () => {
      const drawVisual = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.fillStyle = 'rgba(249, 249, 249, 0.2)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // 根据音量设置颜色
        const r = 108 + (dataArray[i] / 2);
        const g = 99 + (dataArray[i] / 4);
        const b = 255;
        
        canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
    
    return () => {
      // 清理
      source.disconnect();
      audioContext.close();
    };
  }, [stream]);
  
  return (
    <div className="mt-4">
      <canvas ref={canvasRef} className="rounded-lg"></canvas>
    </div>
  );
};

export default AudioVisualizer;
