import { useState, useEffect, useCallback } from "react";
import { getDatabase, ref, get } from "firebase/database";

const useFetchPostComments = (postKey) => {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!postKey) return;

    try {
      setCommentsLoading(true);
      const db = getDatabase();
      const commentsRef = ref(db, `Posts/${postKey}/comments`);
      const snapshot = await get(commentsRef);

      if (!snapshot.exists()) {
        setComments([]);
        return;
      }

      const commentData = snapshot.val();
      const commentsArray = Object.keys(commentData).map((key) => ({
        id: key,
        ...commentData[key],
      }));

      const userIds = [...new Set(commentsArray.map((c) => c.uid))];

      const usersProfiles = await Promise.all(
        userIds.map(async (uid) => {
          const userSnap = await get(ref(db, `users/${uid}`));
          return userSnap.exists() ? { uid, ...userSnap.val() } : null;
        })
      );

      const usersMap = {};
      usersProfiles.forEach((user) => {
        if (user) usersMap[user.uid] = user;
      });

      const commentsList = commentsArray.map((comment) => ({
        ...comment,
        displayName: usersMap[comment.uid]?.displayName || "Unknown",
      }));

      setComments(commentsList);
    } catch (error) {
      console.error(error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [postKey]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, setComments, commentsLoading, fetchComments };
};

export default useFetchPostComments;
