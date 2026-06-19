import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import mediasReducer from "./slices/mediasSlice";
import channelsReducer from "./slices/channelsSlice";
import uiReducer from "./slices/uiSlice";
import { RootState } from "@/types";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    medias: mediasReducer,
    channels: channelsReducer,
    ui: uiReducer,
  },
});

// Export hooks for usage in components
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
