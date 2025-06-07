import { AUDIO_CONFIG, ERROR_MESSAGES } from '../config/constants';

/**
 * 检查浏览器音频支持
 * @returns {Object} 支持信息
 */
export const checkAudioSupport = () => {
  const support = {
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: !!window.MediaRecorder,
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    audioElement: !!document.createElement('audio').canPlayType
  };
  
  support.fullSupport = support.getUserMedia && support.mediaRecorder && support.webAudio;
  
  return support;
};

/**
 * 获取音频录制权限
 * @returns {Promise<MediaStream>}
 */
export const getAudioPermission = async () => {
  try {
    const constraints = {
      audio: {
        sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
        channelCount: AUDIO_CONFIG.CHANNELS,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('获取音频权限失败:', error);
    
    let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
    
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        errorMessage = ERROR_MESSAGES.PERMISSION_DENIED;
        break;
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        errorMessage = '未找到音频输入设备';
        break;
      case 'NotReadableError':
      case 'TrackStartError':
        errorMessage = '音频设备被其他应用占用';
        break;
      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        errorMessage = '音频设备不支持所需配置';
        break;
      case 'NotSupportedError':
        errorMessage = ERROR_MESSAGES.AUDIO_NOT_SUPPORTED;
        break;
      case 'TypeError':
        errorMessage = '音频配置参数错误';
        break;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * 创建音频录制器
 * @param {MediaStream} stream 音频流
 * @returns {Object} 录制器对象
 */
export const createAudioRecorder = (stream) => {
  const chunks = [];
  let mediaRecorder;
  let startTime;
  let duration = 0;
  
  try {
    // 尝试使用最佳音频格式
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    if (!selectedMimeType) {
      throw new Error('浏览器不支持任何音频录制格式');
    }
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      audioBitsPerSecond: 128000
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstart = () => {
      startTime = Date.now();
      chunks.length = 0;
    };
    
    mediaRecorder.onstop = () => {
      duration = Date.now() - startTime;
    };
    
  } catch (error) {
    console.error('创建音频录制器失败:', error);
    throw new Error('无法创建音频录制器');
  }
  
  return {
    start: () => {
      if (mediaRecorder.state === 'inactive') {
        mediaRecorder.start(100); // 每100ms收集一次数据
      }
    },
    
    stop: () => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    },
    
    pause: () => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
      }
    },
    
    resume: () => {
      if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
      }
    },
    
    getState: () => mediaRecorder.state,
    
    getBlob: () => {
      if (chunks.length === 0) {
        return null;
      }
      
      return new Blob(chunks, { 
        type: mediaRecorder.mimeType || 'audio/webm' 
      });
    },
    
    getDuration: () => duration,
    
    getMimeType: () => mediaRecorder.mimeType,
    
    addEventListener: (event, handler) => {
      mediaRecorder.addEventListener(event, handler);
    },
    
    removeEventListener: (event, handler) => {
      mediaRecorder.removeEventListener(event, handler);
    }
  };
};

/**
 * 创建音频分析器
 * @param {MediaStream} stream 音频流
 * @returns {Object} 分析器对象
 */
export const createAudioAnalyzer = (stream) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  
  source.connect(analyser);
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  return {
    getVolumeLevel: () => {
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      return sum / bufferLength / 255; // 返回0-1之间的值
    },
    
    getFrequencyData: () => {
      analyser.getByteFrequencyData(dataArray);
      return Array.from(dataArray);
    },
    
    getTimeDomainData: () => {
      const timeDomainData = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(timeDomainData);
      return Array.from(timeDomainData);
    },
    
    destroy: () => {
      source.disconnect();
      audioContext.close();
    }
  };
};

/**
 * 验证音频文件
 * @param {Blob} audioBlob 音频Blob
 * @param {number} duration 录制时长
 * @returns {Object} 验证结果
 */
export const validateAudioFile = (audioBlob, duration) => {
  const errors = [];
  
  // 检查文件大小
  if (audioBlob.size === 0) {
    errors.push('音频文件为空');
  } else if (audioBlob.size > 10 * 1024 * 1024) { // 10MB
    errors.push('音频文件过大');
  }
  
  // 检查录制时长
  if (duration < 500) {
    errors.push(ERROR_MESSAGES.RECORDING_TOO_SHORT);
  } else if (duration > AUDIO_CONFIG.MAX_DURATION) {
    errors.push(ERROR_MESSAGES.RECORDING_TOO_LONG);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 转换音频格式
 * @param {Blob} audioBlob 原始音频
 * @param {string} targetFormat 目标格式
 * @returns {Promise<Blob>} 转换后的音频
 */
export const convertAudioFormat = async (audioBlob, targetFormat = 'wav') => {
  // 这里可以实现音频格式转换
  // 目前直接返回原始音频
  return audioBlob;
};

/**
 * 获取音频元数据
 * @param {Blob} audioBlob 音频文件
 * @returns {Promise<Object>} 元数据
 */
export const getAudioMetadata = async (audioBlob) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    audio.onloadedmetadata = () => {
      const metadata = {
        duration: audio.duration,
        size: audioBlob.size,
        type: audioBlob.type,
        url: url
      };
      
      resolve(metadata);
    };
    
    audio.onerror = () => {
      resolve({
        duration: 0,
        size: audioBlob.size,
        type: audioBlob.type,
        url: url
      });
    };
    
    audio.src = url;
  });
};

/**
 * 清理音频资源
 * @param {string} audioUrl 音频URL
 */
export const cleanupAudioUrl = (audioUrl) => {
  if (audioUrl && audioUrl.startsWith('blob:')) {
    URL.revokeObjectURL(audioUrl);
  }
};
