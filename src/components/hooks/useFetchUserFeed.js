import { useState, useEffect, useCallback } from "react";
import {
  getDatabase,
  ref,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import useCheckFriendship from "./useCheckFriendship";

const useFetchUserFeed = (currentUser, userId) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isFriends, isLoadingFriendshipCheck } = useCheckFriendship(
    currentUser,
    userId
  );

  const fetchPosts = useCallback(async () => {
    if (!userId || !isLoadingFriendshipCheck) return;
    setIsLoading(true);

    const db = getDatabase();
    const postsRef = ref(db, "Posts");
    const q = query(postsRef, orderByChild("uid"), equalTo(userId));
    const snapshot = await get(q);

    if (snapshot.exists()) {
      let fetchedPosts = Object.entries(snapshot.val()).map(
        ([postKey, post]) => ({ ...post, postKey })
      );

      //check if friends
      if (currentUser.uid !== userId) {
        if (isFriends) {
          fetchedPosts = fetchedPosts.filter(
            (post) =>
              post.visibility === "Public" || post.visibility === "Friends"
          );
        } else {
          fetchedPosts = fetchedPosts.filter(
            (post) => post.visibility === "Public"
          );
        }
      }
      fetchedPosts.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setPosts(fetchedPosts);
    } else {
      setPosts([]);
    }

    setIsLoading(false);
  }, [currentUser, userId, isFriends]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, setPosts, isLoading, fetchPosts };
};

export default useFetchUserFeed;
