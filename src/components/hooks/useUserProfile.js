import { useState, useEffect } from "react";
import { get, child } from "firebase/database";
import { db } from "../../firebase";

export const useUserProfile = (userId) => {
  const [userDetails, setUserDetails] = useState(null);
  const [UserProfileLoading, setUserProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    setUserProfileLoading(true);
    setError(null);

    const dbRef = db.ref();

    get(child(dbRef, `users/${userId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserDetails(userData);
        } else {
          setError("No data found for user");
          setUserDetails(null);
        }
        setUserProfileLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
        setError(err);
        setUserDetails(null);
        setUserProfileLoading(false);
      });
  }, [userId]);

  return { userDetails, UserProfileLoading, error };
};
