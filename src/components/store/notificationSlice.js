import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notification: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notification = action.payload;
    },

    clearNotifications: (state) => {
      state.notification = [];
    },

    updateNotifications: (state, action) => {
      if (state.notification) {
        state.notification = { ...state.notification, ...action.payload };
      }
    },
  },
});

export const { setNotifications, clearNotifications, updateNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
