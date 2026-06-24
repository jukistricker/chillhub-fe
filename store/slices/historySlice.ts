// store/slices/mediaHistorySlice.ts
import { mediaHistoryService } from "@/services/history.service";
import { MediaHistoryState } from "@/types";
import { MediaHistory, MediaHistoryFilterRequest } from "@/types/history";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState: MediaHistoryState = {
  items: [],
  loading: false,
  error: null,
  nextCursor: null,
  hasMore: true,
};

export const fetchMediaHistories = createAsyncThunk(
  "mediaHistory/fetchList",
  async (request: MediaHistoryFilterRequest, { rejectWithValue }) => {
    try {
      const response = await mediaHistoryService.fetchHistories(request);
      console.log(response)
      return response; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to load watch history");
    }
  }
);

const mediaHistorySlice = createSlice({
  name: "mediaHistory",
  initialState,
  reducers: {
    clearHistoryState: (state) => {
      state.items = [];
      state.nextCursor = null;
      state.hasMore = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMediaHistories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMediaHistories.fulfilled, (state, action) => {
        state.loading = false;
        
        if (!action.meta.arg.cursor) {
          state.items = action.payload.items;
        } else {
          state.items = [...state.items, ...action.payload.items];
        }

        state.nextCursor = action.payload.nextCursor;
        state.hasMore = action.payload.hasNextPage;
      })
      .addCase(fetchMediaHistories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearHistoryState } = mediaHistorySlice.actions;
export default mediaHistorySlice.reducer;