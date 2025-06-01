import { configureStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import recordingReducer from './recordingSlice';
import galleryReducer from './gallerySlice';
import environmentReducer from './environmentSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    recording: recordingReducer,
    gallery: galleryReducer,
    environment: environmentReducer,
  },
});
