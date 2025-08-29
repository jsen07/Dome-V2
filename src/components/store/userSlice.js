import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeUser: null,
};

const userSlice = createSlice({
  name: "User",
  initialState,
  reducers: {
    setActiveUser: (state, action) => {
      state.activeUser = action.payload;
    },

    clearActiveUser: (state) => {
      state.activeUser = null;
    },

    updateActiveUser: (state, action) => {
      if (state.activeUser) {
        state.activeUser = { ...state.activeUser, ...action.payload };
      }
    },
  },
});

export const { setActiveUser, clearActiveUser, updateActiveUser } =
  userSlice.actions;
export default userSlice.reducer;
