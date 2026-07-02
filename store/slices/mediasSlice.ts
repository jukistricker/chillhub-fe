import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { CheckReactionRequest, Media, MediaFilterRequest, ReactionResponse } from "@/types/media";
import { ApiResponse, CursorPagedData } from "@/types/base";
import api from "@/lib/apiClient";
import { mediaService } from "@/services/media.service";
import { MediaState } from "@/types";


const metadataWorkerUrl = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL;

const initialState: MediaState = {
  items: [],
  nextCursor: null,
  pageSize: 10,
  isDescending: true,
  search: "",
  hasMore: true,
  loading: false,
  error: null,
  selectedMedia: null,
  isSubscribed: false,
  isNoticed:false,
  subscribing: false,
};

// Đảm bảo endpoint map với Controller của bạn (ở đây giả định là /api/medias/search hoặc tương tự)
export const fetchMedias = createAsyncThunk(
  "media/fetchMedias",
  async (filters: MediaFilterRequest, { rejectWithValue }) => {
    try {
      const response = await api.get<CursorPagedData<Media>>("/media", {
        params: filters,
      });
      console.log(response);
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch medias",
      );
    }
  },
);

export const deleteMedia = createAsyncThunk(
  "media/deleteMedia",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/medias/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete media",
      );
    }
  },
);

export const checkMediaReaction = createAsyncThunk(
  'media/checkReaction',
  async (params: CheckReactionRequest, { rejectWithValue }) => {
    try {
      // Gọi API GET /media/reaction với query params
      const response = await api.get<CursorPagedData<ReactionResponse>>('/media/reaction', {
        params: {
          UserId: params.UserId,
          MediaId: params.MediaId
        },
        
    requireAuth: true,
  
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check reaction');
    }
  }
);

export const getSubscriberStatus = createAsyncThunk(
  "media/getSubscriberStatus",
  async (channelId: string, { rejectWithValue }) => {
    try {
      const data = await mediaService.getSubscriberStatus(channelId);
      console.log("getSubscriberStatusdata", data)
      return data; 
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get subscription status"
      );
    }
  }
);

export const batchSubscribe = createAsyncThunk(
  "media/batchSubscribe",
  async (
    payload: { subscriberId: string; channelId: string; isNotice: boolean; createdAt: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${metadataWorkerUrl}/api/subscribe`, { // Giả định endpoint của worker là /api/subscribe
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Worker failed to queue subscribe action");
      }

      console.log("[Worker Sync] Đã đẩy yêu cầu Đăng ký vào hàng đợi.");
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to subscribe via worker");
    }
  }
);

export const batchUnsubscribe = createAsyncThunk(
  "media/batchUnsubscribe",
  async (
    payload: { subscriberId: string; channelId: string; createdAt: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${metadataWorkerUrl}/api/unsubscribe`, { // Giả định endpoint của worker là /api/unsubscribe
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Worker failed to queue unsubscribe action");
      }

      console.log("[Worker Sync] Đã đẩy yêu cầu Hủy đăng ký vào hàng đợi.");
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to unsubscribe via worker");
    }
  }
);

const mediaSlice = createSlice({
  name: "media",
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
    },
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
        console.log(action.payload);
        const { items, nextCursor, hasNextPage } = action.payload;
        const isLoadMore = !!action.meta.arg.cursor;

        // Backend cung cấp sẵn cờ phân trang
        state.hasMore = hasNextPage;
        state.nextCursor = nextCursor;

        // Cập nhật params filter hiện tại vào state
        if (action.meta.arg.search !== undefined)
          state.search = action.meta.arg.search || "";
        if (action.meta.arg.pageSize !== undefined)
          state.pageSize = action.meta.arg.pageSize;

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
      })

      .addCase(getSubscriberStatus.fulfilled, (state, action) => {
        state.isSubscribed = action.payload.isSubscribed;
        state.isNoticed=action.payload.isNoticed;
      })

      // Handle Batch Subscribe
      .addCase(batchSubscribe.pending, (state) => {
        state.subscribing = true;
      })
      .addCase(batchSubscribe.fulfilled, (state) => {
        state.subscribing = false;
        state.isSubscribed = true; // Cập nhật UI thành Đã đăng ký
      })
      .addCase(batchSubscribe.rejected, (state, action) => {
        state.subscribing = false;
        state.error = action.payload as string;
      })

      // Handle Batch Unsubscribe
      .addCase(batchUnsubscribe.pending, (state) => {
        state.subscribing = true;
      })
      .addCase(batchUnsubscribe.fulfilled, (state) => {
        state.subscribing = false;
        state.isSubscribed = false; // Cập nhật UI thành Chưa đăng ký
      })
      .addCase(batchUnsubscribe.rejected, (state, action) => {
        state.subscribing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetPagination, setSearchQuery } =
  mediaSlice.actions;
export default mediaSlice.reducer;
