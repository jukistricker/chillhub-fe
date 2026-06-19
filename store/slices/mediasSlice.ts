import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Media, MediaFilterRequest } from '@/types/media';
import { ApiResponse, CursorPagedData } from '@/types/base';
import api from '@/lib/apiClient';

interface MediaState {
  items: Media[];
  nextCursor: string | null;
  pageSize: number;
  isDescending: boolean;
  search: string;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  selectedMedia: Media | null;
}

const initialState: MediaState = {
  items: [],
  nextCursor: null,
  pageSize: 10,
  isDescending: true,
  search: '',
  hasMore: true,
  loading: false,
  error: null,
  selectedMedia: null,
};

// Đảm bảo endpoint map với Controller của bạn (ở đây giả định là /api/medias/search hoặc tương tự)
export const fetchMedias = createAsyncThunk(
  'media/fetchMedias',
  async (filters: MediaFilterRequest, { rejectWithValue }) => {
    try {
      const response = await api.get<CursorPagedData<Media>>('/media', { params: filters });
      console.log(response)
      console.log(response.data)
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch medias');
    }
  }
);

export const deleteMedia = createAsyncThunk(
  'media/deleteMedia',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/medias/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete media');
    }
  }
);

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetPagination: (state) => {
      state.items = [];
      state.nextCursor = null;
      state.hasMore = true;
    },
    setSearchQuery: (state, action) => {
      state.search = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Medias
      .addCase(fetchMedias.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedias.fulfilled, (state, action) => {
  state.loading = false;
  
  // SỬA TẠI ĐÂY: Thay 'action.payload.data' thành 'action.payload'
  const { items, nextCursor, hasNextPage } = action.payload;
  const isLoadMore = !!action.meta.arg.cursor;

  // Backend cung cấp sẵn cờ phân trang
  state.hasMore = hasNextPage;
  state.nextCursor = nextCursor;

  // Cập nhật params filter hiện tại vào state
  if (action.meta.arg.search !== undefined) state.search = action.meta.arg.search || '';
  if (action.meta.arg.pageSize !== undefined) state.pageSize = action.meta.arg.pageSize;

  // Ghép mảng nếu là load more, thay thế nếu fetch mới
  if (isLoadMore) {
    state.items = [...state.items, ...items];
  } else {
    state.items = items;
  }
})
      .addCase(fetchMedias.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete Media
      .addCase(deleteMedia.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export const { clearError, resetPagination, setSearchQuery } = mediaSlice.actions;
export default mediaSlice.reducer;