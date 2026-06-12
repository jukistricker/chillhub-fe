import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UIState } from "@/types";

const initialState: UIState = {
  sidebarOpen: true,
  searchQuery: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearchQuery: (state) => {
      state.searchQuery = "";
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setSearchQuery,
  clearSearchQuery,
} = uiSlice.actions;
export default uiSlice.reducer;
