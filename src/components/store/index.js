import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import notificationReducer from "./notificationSlice";
import { loadState, saveState } from "./localstorage";

const preloadedState = loadState();

const store = configureStore({
  reducer: {
    user: userReducer,
    notification: notificationReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  saveState({
    user: store.getState().user,
    notification: store.getState().notification,
  });
});

export default store;
