import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 收集环境数据
export const collectEnvironmentData = createAsyncThunk(
  'environment/collect',
  async (_, { rejectWithValue }) => {
    try {
      // 获取地理位置
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude, accuracy } = position.coords;
      
      // 获取设备信息
      const deviceData = {
        orientation: window.screen.orientation.type,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenBrightness: 'unknown', // 需要权限，可能无法获取
        batteryLevel: 'unknown',
        userAgent: navigator.userAgent
      };
      
      // 尝试获取电池信息
      try {
        if ('getBattery' in navigator) {
          const battery = await navigator.getBattery();
          deviceData.batteryLevel = battery.level;
        }
      } catch (e) {
        console.log('Battery info not available');
      }
      
      return {
        location: {
          latitude,
          longitude,
          accuracy
        },
        device: deviceData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to collect environment data:', error);
      return rejectWithValue(error.message);
    }
  }
);

const environmentSlice = createSlice({
  name: 'environment',
  initialState: {
    environmentData: null,
    isCollecting: false,
    isReady: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(collectEnvironmentData.pending, (state) => {
        state.isCollecting = true;
        state.isReady = false;
        state.error = null;
      })
      .addCase(collectEnvironmentData.fulfilled, (state, action) => {
        state.environmentData = action.payload;
        state.isCollecting = false;
        state.isReady = true;
      })
      .addCase(collectEnvironmentData.rejected, (state, action) => {
        state.isCollecting = false;
        state.isReady = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export default environmentSlice.reducer;
