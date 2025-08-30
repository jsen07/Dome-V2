import { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, get } from "firebase/database";

const useCheckFriendship = (currentUser, userId) => {
  const [isLoadingFriendshipCheck, setIsLoading] = useState(true);
  const [isFriends, setIsFriends] = useState(false);

  const checkFriendship = useCallback(async () => {
    if (!userId || !currentUser) {
      setIsFriends(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const friendsRef = ref(getDatabase(), `friendsList/${userId}`);
      const friendSnap = await get(friendsRef);
      const userFriendsList = friendSnap.val();

      const friendsArray = userFriendsList?.friends || [];
      setIsFriends(friendsArray.includes(currentUser));
    } catch (error) {
      console.error(error);
      setIsFriends(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    checkFriendship();
  }, [checkFriendship]);

  return { isFriends, setIsFriends, isLoadingFriendshipCheck, checkFriendship };
};

export default useCheckFriendship;
