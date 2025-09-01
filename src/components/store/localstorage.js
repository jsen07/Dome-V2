export const loadState = () => {
  try {
    const serializedStateUser = localStorage.getItem("userSlice");
    const serializedStateNotifications =
      localStorage.getItem("notificationSlice");
    if (serializedStateUser === null || serializedStateNotifications === null) {
      return undefined;
    }
    return {
      user: JSON.parse(serializedStateUser),
      notification: JSON.parse(serializedStateNotifications),
    };
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

export const saveState = (state) => {
  try {
    const serializedStateUser = JSON.stringify(state.user);
    const serializedStateNotifications = JSON.stringify(state.notification);
    localStorage.setItem("userSlice", serializedStateUser);
    localStorage.setItem("notificationSlice", serializedStateNotifications);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};
