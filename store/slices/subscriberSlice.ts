import { Subscriber, SubscriberFilterRequest } from "@/types/subscriber";

export interface SubscribersState {
  subscribers: Subscriber[];
  nextCursor: string | null;
  hasNextPage: boolean;
  loading: boolean;
  error: string | null;
}

import api from '@/lib/apiClient';
import { ApiResponse, CursorPagedData } from "@/types/base";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";


export const channelService = {
  fetchSubscribers: async (
    request: SubscriberFilterRequest
  ): Promise<CursorPagedData<Subscriber>> => {
    const response = await api.get<CursorPagedData<Subscriber>>('/subscribers', {
      params: request,
      requireAuth: true, 
    });
    return response.data;
  },
};

const initialState: SubscribersState = {
  subscribers: [],
  nextCursor: null,
  hasNextPage: false,
  loading: false,
  error: null,
};

export const fetchSubscribers = createAsyncThunk(
  "subscribers/fetchSubscribers",
  async (request: SubscriberFilterRequest, { rejectWithValue }) => {
    try {
      const response = await channelService.fetchSubscribers(request);
      
      return { 
        data: response, 
        isLoadMore: !!request.cursor 
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch subscribers");
    }
  }
);

const subscribersSlice = createSlice({
  name: "subscribers",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetSubscribers: (state) => {
      state.subscribers = [];
      state.nextCursor = null;
      state.hasNextPage = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscribers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscribers.fulfilled, (state, action) => {
        state.loading = false;
        
        const { data, isLoadMore } = action.payload;

        if (isLoadMore) {
          state.subscribers = [...state.subscribers, ...data.items];
        } else {
          // Lấy lần đầu hoặc Search -> Ghi đè dữ liệu
          state.subscribers = data.items;
        }

        state.nextCursor = data.nextCursor;
        state.hasNextPage = data.hasNextPage;
      })
      .addCase(fetchSubscribers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetSubscribers } = subscribersSlice.actions;
export default subscribersSlice.reducer;