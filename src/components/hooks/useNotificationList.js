import { useState, useEffect } from "react";
import { getDatabase, ref, child, get, onValue } from "firebase/database";
import { useSelector } from "react-redux";
import { useAuth } from "../contexts/AuthContext";
import { useDispatch } from "react-redux";
import { setNotifications } from "../store/notificationSlice";

export const useNotifications = () => {
  const { currentUser } = useAuth();

  const [requestList, setRequestList] = useState([]);
  const [postList, setPostList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [mergedAndSortedList, setMergedAndSortedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const notifications = useSelector((state) => state.notification.notification);

  // Fetch friend requests
  useEffect(() => {
    if (!currentUser) return;
    const friendsRef = ref(getDatabase(), `friendRequests/${currentUser.uid}`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      setRequestList(snapshot.exists() ? Object.values(snapshot.val()) : []);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const db = getDatabase();
    const notificationsRef = ref(db, `notifications`);
    setLoading(true);

    const unsubscribe = onValue(notificationsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setMessagesList([]);
        setPostList([]);
        setLoading(false);
        return;
      }

      const notifications = snapshot.val();

      // Messages
      const messages = notifications.chat
        ? Object.values(notifications.chat[currentUser.uid] || [])
        : [];
      setMessagesList(messages);

      // Posts
      let newPost = [];
      if (notifications.posts && notifications.posts[currentUser.uid]) {
        const dbRef = ref(db);
        const postsData = Object.values(notifications.posts[currentUser.uid]);

        for (const commentGroup of postsData) {
          const nestedComments = Object.values(commentGroup).flatMap(
            Object.values
          );

          for (const c of nestedComments) {
            const [userSnap, postSnap] = await Promise.all([
              get(child(dbRef, `users/${c.uid}`)),
              get(child(dbRef, `Posts/${c.postId}`)),
            ]);

            if (userSnap.exists() && postSnap.exists()) {
              const userDetails = userSnap.val();
              const postData = postSnap.val();
              newPost.push({
                ...c,
                displayName: userDetails.displayName,
                imageUrl: postData.imageUrl || "",
                post: postData.post || "",
              });
            }
          }
        }
      }

      setPostList(newPost);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Merge and sort all notifications
  useEffect(() => {
    if (loading || !currentUser) return;

    const combined = [
      ...requestList.map((r) => ({ ...r, type: "request" })),
      ...postList.map((p) => ({ ...p, type: "post" })),
      ...messagesList.map((m) => ({ ...m, type: "message" })),
    ];
    const sortedNotifications = combined.sort(
      (a, b) => b.timestamp - a.timestamp
    );

    setMergedAndSortedList(sortedNotifications);
  }, [requestList, postList, messagesList, loading, dispatch]);

  useEffect(() => {
    if (
      !notifications ||
      notifications.length !== mergedAndSortedList.length ||
      !notifications.every((n, i) => n.id === mergedAndSortedList[i].id)
    ) {
      dispatch(setNotifications(mergedAndSortedList));
    }
  }, [mergedAndSortedList, notifications, dispatch]);

  return {
    requestList,
    postList,
    messagesList,
    mergedAndSortedList,
    loading,
    setMergedAndSortedList,
    setRequestList,
    notifications,
  };
};
