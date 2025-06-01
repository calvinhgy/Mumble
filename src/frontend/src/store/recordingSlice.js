import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// 开始录音
export const startRecording = createAsyncThunk(
  'recording/start',
  async (_, { getState, rejectWithValue }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });
      
      const startTime = Date.now();
      mediaRecorder.start();
      
      return {
        stream,
        mediaRecorder,
        audioChunks,
        startTime
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
      return rejectWithValue(error.message);
    }
  }
);

// 停止录音
export const stopRecording = createAsyncThunk(
  'recording/stop',
  async (_, { getState, dispatch }) => {
    const { mediaRecorder, audioChunks, stream } = getState().recording;
    
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      throw new Error('No active recording found');
    }
    
    return new Promise((resolve) => {
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const duration = (Date.now() - getState().recording.startTime) / 1000;
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
        
        resolve({
          audioBlob,
          duration
        });
      });
      
      mediaRecorder.stop();
    });
  }
);

// 处理录音并生成图像
export const processRecording = createAsyncThunk(
  'recording/process',
  async (_, { getState, dispatch }) => {
    const { audioBlob, duration } = getState().recording;
    const { environmentData } = getState().environment;
    const { preferences } = getState().app;
    
    try {
      // 上传音频
      const formData = new FormData();
      formData.append('audioFile', audioBlob);
      formData.append('duration', duration.toString());
      
      const audioResponse = await api.post('/audio', formData);
      const { audioId } = audioResponse.data;
      
      // 提交环境数据
      const envResponse = await api.post('/environment', environmentData);
      const { environmentId } = envResponse.data;
      
      // 请求生成图像
      const generateResponse = await api.post('/images/generate', {
        audioId,
        environmentId,
        stylePreference: preferences.imageStyle
      });
      
      const { requestId, estimatedTime } = generateResponse.data;
      
      // 开始轮询图像生成状态
      return pollImageStatus(requestId, estimatedTime);
    } catch (error) {
      console.error('Failed to process recording:', error);
      throw error;
    }
  }
);

// 轮询图像生成状态
const pollImageStatus = async (requestId, estimatedTime) => {
  // 初始延迟，根据估计时间调整
  const initialDelay = Math.min(1000, estimatedTime * 100);
  let delay = initialDelay;
  
  // 最多轮询30次
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const response = await api.get(`/images/status/${requestId}`);
      const { status, imageId, imageUrl } = response.data;
      
      if (status === 'completed') {
        return { imageId, imageUrl };
      } else if (status === 'error') {
        throw new Error('Image generation failed');
      }
      
      // 增加延迟，但不超过3秒
      delay = Math.min(delay * 1.5, 3000);
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }
      // 404意味着状态尚未更新，继续轮询
    }
  }
  
  throw new Error('Polling timeout');
};

const recordingSlice = createSlice({
  name: 'recording',
  initialState: {
    isRecording: false,
    stream: null,
    mediaRecorder: null,
    audioChunks: [],
    audioBlob: null,
    duration: 0,
    startTime: null,
    isProcessing: false,
    generatedImageId: null,
    generatedImageUrl: null,
    error: null
  },
  reducers: {
    resetRecording: (state) => {
      state.audioBlob = null;
      state.duration = 0;
      state.generatedImageId = null;
      state.generatedImageUrl = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(startRecording.pending, (state) => {
        state.isRecording = false;
        state.error = null;
      })
      .addCase(startRecording.fulfilled, (state, action) => {
        state.isRecording = true;
        state.stream = action.payload.stream;
        state.mediaRecorder = action.payload.mediaRecorder;
        state.audioChunks = action.payload.audioChunks;
        state.startTime = action.payload.startTime;
      })
      .addCase(startRecording.rejected, (state, action) => {
        state.isRecording = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(stopRecording.pending, (state) => {
        state.isRecording = true;
      })
      .addCase(stopRecording.fulfilled, (state, action) => {
        state.isRecording = false;
        state.audioBlob = action.payload.audioBlob;
        state.duration = action.payload.duration;
        state.stream = null;
        state.mediaRecorder = null;
        state.audioChunks = [];
      })
      .addCase(stopRecording.rejected, (state, action) => {
        state.isRecording = false;
        state.error = action.error.message;
      })
      .addCase(processRecording.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processRecording.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.generatedImageId = action.payload.imageId;
        state.generatedImageUrl = action.payload.imageUrl;
      })
      .addCase(processRecording.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.error.message;
      });
  }
});

export const { resetRecording } = recordingSlice.actions;

export default recordingSlice.reducer;
