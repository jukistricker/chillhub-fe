import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import videosReducer from "./slices/videosSlice";
import channelsReducer from "./slices/channelsSlice";
import themeReducer from "./slices/themeSlice";
import uiReducer from "./slices/uiSlice";
import { RootState } from "@/types";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    videos: videosReducer,
    channels: channelsReducer,
    theme: themeReducer,
    ui: uiReducer,
  },
});

// Export hooks for usage in components
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
