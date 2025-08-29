export const loadState = () => {
  try {
    const serializedStateUser = localStorage.getItem("userSlice");
    if (serializedStateUser === null) {
      return undefined;
    }
    return {
      user: JSON.parse(serializedStateUser),
    };
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedStateUser = JSON.stringify(state.user);
    localStorage.setItem("userSlice", serializedStateUser);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};
