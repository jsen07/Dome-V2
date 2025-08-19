import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, get } from "firebase/database";

export function useUserStatus(userId) {
  const [status, setStatus] = useState("Offline");

  useEffect(() => {
    if (!userId) return;

    const statusRef = ref(getDatabase(), `status/${userId}`);

    get(statusRef).then((snapshot) => {
      const statusData = snapshot.val() || {};
      const isOnline = Object.values(statusData).some(
        (device) => device.state === "Online"
      );
      setStatus(isOnline ? "Online" : "Offline");
    });

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const statusData = snapshot.val() || {};
      const isOnline = Object.values(statusData).some(
        (device) => device.state === "Online"
      );
      setStatus(isOnline ? "Online" : "Offline");
    });

    return () => unsubscribe();
  }, [userId]);

  return status;
}
