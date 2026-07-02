import api from '@/lib/apiClient';
import { Category, CategoryFilterRequest } from '@/types/category';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';


export interface CategoriesState {
  items: Category[];
  nextCursor: string | null;
  pageSize: number;
  isDescending: boolean;
  search: string;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  selectedCategory: Category | null;
}

const initialState: CategoriesState = {
  items: [],
  nextCursor: null,
  pageSize: 10,
  isDescending: true,
  search: '',
  hasMore: true,
  loading: false,
  error: null,
  selectedCategory: null,
};

// GET /category
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (filters: CategoryFilterRequest, { rejectWithValue }) => {
    try {
      const response = await api.get('/category', { params: filters });
      console.log("response.data", response.data)
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

// POST /category
export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (data: { name: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/category', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

// PUT /category/{id}
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async (data: { id: string; name: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/category/${data.id}`, data, {requireAuth:true});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
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
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories (Cursor Pagination)
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        const fetchedData: Category[] = action.payload.items || [];
        const requestedPageSize = action.meta.arg.pageSize || state.pageSize;
        const isLoadMore = !!action.meta.arg.cursor;

        if (fetchedData.length < requestedPageSize) {
          state.hasMore = false;
          state.nextCursor = null;
        } else {
          state.hasMore = true;
          const lastItem = fetchedData[fetchedData.length - 1];
          state.nextCursor = lastItem ? lastItem.id : null;
        }

        if (action.meta.arg.search !== undefined) state.search = action.meta.arg.search || '';
        if (action.meta.arg.pageSize !== undefined) state.pageSize = action.meta.arg.pageSize;
        if (action.meta.arg.isDescending !== undefined) state.isDescending = action.meta.arg.isDescending;

        if (isLoadMore) {
          state.items = [...state.items, ...fetchedData];
        } else {
          state.items = fetchedData;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload.data);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const updated: Category = action.payload.data;
        const index = state.items.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
          state.items[index] = updated;
        }
        if (state.selectedCategory?.id === updated.id) {
          state.selectedCategory = updated;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetPagination, setSearchQuery, setSelectedCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;