import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ChannelsState, ChannelDetail } from "@/types";
import { apiService } from "@/lib/api/api";

const initialState: ChannelsState = {
  channels: [],
  channelDetail: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchChannelDetail = createAsyncThunk(
  "channels/fetchChannelDetail",
  async (channelId: string, { rejectWithValue }) => {
    try {
      const channel = await apiService.fetchChannelDetail(channelId);
      return channel;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch channel");
    }
  }
);

export const subscribeChannel = createAsyncThunk(
  "channels/subscribeChannel",
  async (channelId: string, { rejectWithValue }) => {
    try {
      const channel = await apiService.subscribeChannel(channelId);
      return channel;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to subscribe");
    }
  }
);

const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetChannelDetail: (state) => {
      state.channelDetail = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Channel Detail
    builder.addCase(fetchChannelDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchChannelDetail.fulfilled,
      (state, action: PayloadAction<ChannelDetail>) => {
        state.loading = false;
        state.channelDetail = action.payload;
        state.error = null;
      }
    );
    builder.addCase(fetchChannelDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Subscribe Channel
    builder.addCase(
      subscribeChannel.fulfilled,
      (state, action: PayloadAction<ChannelDetail>) => {
        state.channelDetail = action.payload;
      }
    );
  },
});

export const { clearError, resetChannelDetail } = channelsSlice.actions;
export default channelsSlice.reducer;
