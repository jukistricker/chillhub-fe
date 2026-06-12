import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { VideosState, Video, VideoDetail, Comment } from "@/types";
import { apiService } from "@/lib/api/api";

const initialState: VideosState = {
  videos: [],
  videoDetail: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
  },
};

// Async Thunks
export const fetchVideos = createAsyncThunk(
  "videos/fetchVideos",
  async (
    { page = 1, limit = 12 }: { page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const result = await apiService.fetchVideos(page, limit);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch videos");
    }
  }
);

export const fetchVideoDetail = createAsyncThunk(
  "videos/fetchVideoDetail",
  async (videoId: string, { rejectWithValue }) => {
    try {
      const video = await apiService.fetchVideoDetail(videoId);
      return video;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch video details");
    }
  }
);

export const searchVideos = createAsyncThunk(
  "videos/searchVideos",
  async (query: string, { rejectWithValue }) => {
    try {
      const videos = await apiService.searchVideos(query);
      return videos;
    } catch (error: any) {
      return rejectWithValue(error.message || "Search failed");
    }
  }
);

export const likeVideo = createAsyncThunk(
  "videos/likeVideo",
  async (videoId: string, { rejectWithValue }) => {
    try {
      const video = await apiService.likeVideo(videoId);
      return video;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to like video");
    }
  }
);

export const addComment = createAsyncThunk(
  "videos/addComment",
  async (
    { videoId, content }: { videoId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const comment = await apiService.addComment(videoId, content);
      return comment;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add comment");
    }
  }
);

const videosSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetVideoDetail: (state) => {
      state.videoDetail = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Videos
    builder.addCase(fetchVideos.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchVideos.fulfilled,
      (
        state,
        action: PayloadAction<{ videos: Video[]; total: number }>
      ) => {
        state.loading = false;
        state.videos = action.payload.videos;
        state.pagination.total = action.payload.total;
        state.error = null;
      }
    );
    builder.addCase(fetchVideos.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Video Detail
    builder.addCase(fetchVideoDetail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchVideoDetail.fulfilled,
      (state, action: PayloadAction<VideoDetail>) => {
        state.loading = false;
        state.videoDetail = action.payload;
        state.error = null;
      }
    );
    builder.addCase(fetchVideoDetail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Search Videos
    builder.addCase(searchVideos.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      searchVideos.fulfilled,
      (state, action: PayloadAction<Video[]>) => {
        state.loading = false;
        state.videos = action.payload;
        state.error = null;
      }
    );
    builder.addCase(searchVideos.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Like Video
    builder.addCase(
      likeVideo.fulfilled,
      (state, action: PayloadAction<Video>) => {
        const index = state.videos.findIndex(
          (v) => v.id === action.payload.id
        );
        if (index !== -1) {
          state.videos[index] = action.payload;
        }

        if (state.videoDetail && state.videoDetail.id === action.payload.id) {
          state.videoDetail = {
            ...state.videoDetail,
            ...action.payload,
          };
        }
      }
    );

    // Add Comment
    builder.addCase(
      addComment.fulfilled,
      (state, action: PayloadAction<Comment>) => {
        if (state.videoDetail) {
          state.videoDetail.comments.unshift(action.payload);
        }
      }
    );
  },
});

export const { clearError, resetVideoDetail } = videosSlice.actions;
export default videosSlice.reducer;
