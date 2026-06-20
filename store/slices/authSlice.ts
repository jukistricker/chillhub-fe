import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "@/types";
import { authService } from "@/services/auth.service";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async Thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      // Sửa lại đoạn trong createAsyncThunk
      const response = await authService.login(credentials.email, credentials.password);
      console.log("Token nhận được từ server:", response); // Log để kiểm tra
      

      console.log("Token đã lưu trong localStorage:", localStorage.getItem("access_token"));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (
    data: { username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const user = await authService.signup(data.username, data.email, data.password);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Signup failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
);

export const userInfo = createAsyncThunk(
  "auth/userInfo",
  async (_, {rejectWithValue})=>{
    try {
      const user = await authService.info();
      console.log("user:", user)
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || "Logout failed");
    }
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      loginUser.fulfilled,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.user = action.payload.user;
        localStorage.setItem("access_token", action.payload.token);
        localStorage.setItem("refresh_token", action.payload.refreshToken);
        state.isAuthenticated = true;
        state.error = null;
      }
    );
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Signup
    builder.addCase(signupUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      signupUser.fulfilled,
      (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      }
    );
    builder.addCase(signupUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logoutUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("access_token")
      state.error = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(userInfo.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(userInfo.fulfilled,
      (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    });
    builder.addCase(userInfo.rejected, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("access_token")
      state.error = null;
    });
    
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
