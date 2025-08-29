import { useState, useEffect, useCallback } from "react";
import {
  getDatabase,
  ref,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import Placeholder from "../images/profile-placeholder-2.jpg";

const useFetchFeed = (currentUser) => {
  const [posts, setPosts] = useState([]);
  const [publicPosts, setPublicPosts] = useState([]);
  const [friendPosts, setFriendPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;

    const db = getDatabase();
    const postsRef = ref(db, "Posts");
    const userRef = ref(db, "users");
    const friendsRef = ref(db, `friendsList/${currentUser.uid}/friends`);
    try {
      setIsLoading(true);

      const userSnap = await get(userRef);
      if (!userSnap.exists()) return;
      const users = userSnap.val();

      // Fetch public posts
      const publicSnap = await get(
        query(postsRef, orderByChild("visibility"), equalTo("Public"))
      );
      let publicPostsData = [];
      if (publicSnap.exists()) {
        publicPostsData = Object.values(publicSnap.val()).map((post) => ({
          ...post,
          displayName: users[post.uid]?.displayName || "Unknown",
          photoUrl: users[post.uid]?.photoUrl || Placeholder,
        }));
      }
      setPublicPosts(publicPostsData);

      const friendsSnap = await get(friendsRef);
      const friendIds = friendsSnap.exists() ? friendsSnap.val() : [];

      // Fetch friend posts
      let friendPostsData = [];
      if (friendIds.length) {
        const friendPostsPromises = friendIds.map(async (friendId) => {
          const snap = await get(
            query(postsRef, orderByChild("uid"), equalTo(friendId))
          );
          return snap.exists() ? Object.values(snap.val()) : [];
        });
        friendPostsData = (await Promise.all(friendPostsPromises)).flat();

        friendPostsData = friendPostsData.map((post) => ({
          ...post,
          displayName: users[post.uid]?.displayName || "Unknown",
          photoUrl: users[post.uid]?.photoUrl || Placeholder,
        }));
      }
      setFriendPosts(friendPostsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const combinedPosts = [...friendPosts, ...publicPosts];

    // Remove duplicates by postKey
    const uniquePostsMap = {};
    combinedPosts.forEach((post) => {
      uniquePostsMap[post.postKey] = post;
    });
    const uniquePosts = Object.values(uniquePostsMap);

    const sortedPosts = uniquePosts.sort((a, b) => b.timestamp - a.timestamp);

    setPosts(sortedPosts);
  }, [friendPosts, publicPosts]);

  return { posts, setPosts, isLoading, fetchPosts };
};

export default useFetchFeed;
