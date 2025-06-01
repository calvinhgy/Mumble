import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDeviceId, getStoredPreferences, storePreferences } from '../utils/storage';
import api from '../services/api';

// 初始化应用
export const initializeApp = createAsyncThunk(
  'app/initialize',
  async (_, { dispatch }) => {
    // 获取设备ID，如果不存在则创建
    const deviceId = getDeviceId();
    
    // 获取存储的偏好设置
    const storedPreferences = getStoredPreferences();
    
    // 如果有存储的设置，使用它们
    if (storedPreferences) {
      return {
        deviceId,
        preferences: storedPreferences,
        isFirstTime: false
      };
    }
    
    // 否则使用默认设置
    return {
      deviceId,
      preferences: {
        imageStyle: 'balanced',
        privacySettings: {
          saveAudioRecordings: false,
          locationPrecision: 'city',
          shareAnalyticsData: true
        },
        notifications: {
          imageGeneration: true,
          newFeatures: false
        }
      },
      isFirstTime: true
    };
  }
);

// 更新用户偏好设置
export const updatePreferences = createAsyncThunk(
  'app/updatePreferences',
  async (preferences, { getState }) => {
    const { deviceId } = getState().app;
    
    // 存储到本地
    storePreferences(preferences);
    
    // 同步到服务器
    try {
      await api.patch('/preferences', { deviceId, preferences });
    } catch (error) {
      console.error('Failed to sync preferences:', error);
      // 即使API调用失败，我们仍然更新本地状态
    }
    
    return preferences;
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState: {
    deviceId: null,
    preferences: {
      imageStyle: 'balanced',
      privacySettings: {
        saveAudioRecordings: false,
        locationPrecision: 'city',
        shareAnalyticsData: true
      },
      notifications: {
        imageGeneration: true,
        newFeatures: false
      }
    },
    isFirstTime: true,
    isInitialized: false,
    error: null
  },
  reducers: {
    setFirstTimeCompleted: (state) => {
      state.isFirstTime = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeApp.pending, (state) => {
        state.isInitialized = false;
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.deviceId = action.payload.deviceId;
        state.preferences = action.payload.preferences;
        state.isFirstTime = action.payload.isFirstTime;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.error = action.error.message;
        state.isInitialized = true;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      });
  }
});

export const { setFirstTimeCompleted } = appSlice.actions;

export default appSlice.reducer;
