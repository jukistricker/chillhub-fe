import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/apiClient';

const metadataWorkerUrl = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL;

export const fetchComments = createAsyncThunk(
  'comments/search',
  async (params: { 
    entityId: string; 
    referenceCommentId?: string | null; 
    cursor?: string | null; 
    pageSize?: number 
  }) => {
    const response: any = await api.get('/comments/search', {
      params: {
        EntityId: params.entityId,
        ReferenceCommentId: params.referenceCommentId,
        PageSize: params.pageSize || 10,
        Cursor: params.cursor || undefined
      },
      requireAuth: false
    });
    return response.data;
  }
);

export const createComment = createAsyncThunk(
  'comments/createBatch',
  async (
    payload: { 
      userId: string; 
      entityId: string; 
      description: string; 
      referenceCommentId?: string; 
      createdAt: string; 
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${metadataWorkerUrl}/api/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Worker failed to queue comment action");
      }

      return payload;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create comment");
    }
  }
);

export interface CommentItem {
  id: string;
  userId: string;
  entityId: string;
  description: string;
  referenceCommentId?: string | null;
  userFullName: string;
  userAvatarUrl?: string;
  createdAt: string;
  hasChildren: boolean;
  replies: CommentItem[];
  repliesLoaded: boolean;   // ✅ Đã từng fetch replies chưa
  repliesVisible: boolean;  // ✅ Đang hiển thị replies không
  repliesCursor: string | null; // ✅ Cursor để load thêm replies
}

interface CommentsState {
  items: CommentItem[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  loadingReplies: Record<string, boolean>; // ✅ Track loading per comment
}

const initialState: CommentsState = {
  items: [],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  loadingReplies: {},
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    resetComments: (state) => {
      state.items = [];
      state.nextCursor = null;
      state.loadingReplies = {};
    },
    // ✅ Toggle hiển thị replies mà không fetch lại
    toggleRepliesVisible: (state, action: PayloadAction<string>) => {
      const comment = state.items.find(item => item.id === action.payload);
      if (comment) {
        comment.repliesVisible = !comment.repliesVisible;
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchComments.pending, (state, action) => {
      const { cursor, referenceCommentId } = action.meta.arg;
      if (referenceCommentId) {
        // Loading replies của một comment cụ thể
        state.loadingReplies[referenceCommentId] = true;
      } else if (cursor) {
        state.loadingMore = true;
      } else {
        state.loading = true;
      }
    });

    builder.addCase(fetchComments.fulfilled, (state, action) => {
      state.loading = false;
      state.loadingMore = false;

      const { cursor, referenceCommentId } = action.meta.arg;
      const newItems = action.payload.items || [];

      if (referenceCommentId) {
        // ✅ Fix: Xóa loading, gộp replies không trùng lặp
        state.loadingReplies[referenceCommentId] = false;

        const parentComment = state.items.find(item => item.id === referenceCommentId);
        if (parentComment) {
          const existingIds = new Set((parentComment.replies || []).map(r => r.id));
          const uniqueNewReplies = newItems.filter((r: CommentItem) => !existingIds.has(r.id));
          
          parentComment.replies = [...(parentComment.replies || []), ...uniqueNewReplies];
          parentComment.repliesCursor = action.payload.nextCursor || null;
          parentComment.hasChildren = true;
          parentComment.repliesLoaded = true;
          parentComment.repliesVisible = true; // ✅ Tự động mở sau khi load
        }
      } else if (cursor) {
        // Load thêm root comments
        const existingIds = new Set(state.items.map(i => i.id));
        const uniqueNew = newItems.filter((i: CommentItem) => !existingIds.has(i.id));
        state.items = [...state.items, ...uniqueNew.map((item: CommentItem) => ({
          ...item,
          replies: [],
          repliesLoaded: false,
          repliesVisible: false,
          repliesCursor: null,
        }))];
        state.nextCursor = action.payload.nextCursor;
      } else {
        // Initial load
        state.items = newItems.map((item: CommentItem) => ({
          ...item,
          replies: item.replies || [],
          repliesLoaded: false,
          repliesVisible: false,
          repliesCursor: null,
        }));
        state.nextCursor = action.payload.nextCursor;
      }
    });

    builder.addCase(fetchComments.rejected, (state, action) => {
      state.loading = false;
      state.loadingMore = false;
      const { referenceCommentId } = action.meta.arg;
      if (referenceCommentId) {
        state.loadingReplies[referenceCommentId] = false;
      }
    });

    builder.addCase(createComment.fulfilled, (state, action) => {
  const newComment = action.payload;

  if (!newComment.referenceCommentId) {
    state.items.unshift({
      ...newComment,
      id: '',
      userFullName: '',
      replies: [],
      hasChildren: false,
      repliesLoaded: false,
      repliesVisible: false,
      repliesCursor: null,
    } as unknown as CommentItem);
  } else {
    const rootComment = state.items.find(
      item => item.id === newComment.referenceCommentId
    );
    if (rootComment) {
      if (!rootComment.replies) rootComment.replies = [];
      rootComment.replies.push({
        ...newComment,
        id: '',
        userFullName: '',
        replies: [],
        hasChildren: false,
        repliesLoaded: false,
        repliesVisible: false,
        repliesCursor: null,
      } as unknown as CommentItem);
      rootComment.hasChildren = true;
      rootComment.repliesVisible = true;
    }
  }
});
  }
});

export const { resetComments, toggleRepliesVisible } = commentsSlice.actions;
export default commentsSlice.reducer;