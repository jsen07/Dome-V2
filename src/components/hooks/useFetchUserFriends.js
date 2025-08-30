import { useState, useEffect } from "react";
import { getDatabase, ref, child, get } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";

export function useFetchUserFriends(userId) {
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!userId || !currentUser) return;

    let isCancelled = false;

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const friendsRef = ref(getDatabase());
        const snapshot = await get(
          child(friendsRef, `friendsList/${userId}/friends`)
        );

        if (snapshot.exists()) {
          const friendsArr = [];
          const promises = [];

          snapshot.forEach((childSnapshot) => {
            const friendId = childSnapshot.val();
            const userRef = ref(getDatabase(), `users/${friendId}`);
            promises.push(
              get(userRef).then((userSnapshot) => {
                if (!isCancelled && userSnapshot.exists()) {
                  friendsArr.push(userSnapshot.val());
                }
              })
            );
          });

          await Promise.all(promises);
          if (!isCancelled) setFriends(friendsArr);
        }
      } catch (error) {
        console.log(error);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchFriends();

    return () => {
      isCancelled = true;
    };
  }, [userId, currentUser]);

  return { friends, loadingFriends };
}
