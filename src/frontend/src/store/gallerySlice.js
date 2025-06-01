import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// 获取图库
export const fetchGallery = createAsyncThunk(
  'gallery/fetchGallery',
  async ({ limit = 20, offset = 0, sortBy = 'createdAt', order = 'desc' }, { rejectWithValue }) => {
    try {
      const response = await api.get('/images', {
        params: { limit, offset, sortBy, order }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 获取图片详情
export const fetchImageDetails = createAsyncThunk(
  'gallery/fetchImageDetails',
  async (imageId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch image details:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 删除图片
export const deleteImage = createAsyncThunk(
  'gallery/deleteImage',
  async (imageId, { rejectWithValue }) => {
    try {
      await api.delete(`/images/${imageId}`);
      return imageId;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 导出图片
export const exportImage = createAsyncThunk(
  'gallery/exportImage',
  async ({ imageId, format = 'jpg', quality = 90 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/images/${imageId}/export`, {
        params: { format, quality },
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mumble-${imageId}.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return imageId;
    } catch (error) {
      console.error('Failed to export image:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const gallerySlice = createSlice({
  name: 'gallery',
  initialState: {
    images: [],
    total: 0,
    hasMore: false,
    currentImage: null,
    isLoading: false,
    isExporting: false,
    error: null
  },
  reducers: {
    clearCurrentImage: (state) => {
      state.currentImage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGallery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.isLoading = false;
        state.images = action.payload.images;
        state.total = action.payload.total;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchImageDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchImageDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentImage = action.payload;
      })
      .addCase(fetchImageDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.images = state.images.filter(image => image.imageId !== action.payload);
        if (state.currentImage && state.currentImage.imageId === action.payload) {
          state.currentImage = null;
        }
      })
      .addCase(exportImage.pending, (state) => {
        state.isExporting = true;
      })
      .addCase(exportImage.fulfilled, (state) => {
        state.isExporting = false;
      })
      .addCase(exportImage.rejected, (state, action) => {
        state.isExporting = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearCurrentImage } = gallerySlice.actions;

export default gallerySlice.reducer;
