import React, { useEffect, useState } from "react";
import { get, ref, child, getDatabase } from "firebase/database";

const useNotificationList = (currentUser) => {
  const [requestList, setRequestList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [postList, setPostList] = useState([]);
  const [loading, setLoading] = useState(false);

  const db = getDatabase();

  const fetchFriendRequests = async () => {
    setLoading(true);
    try {
      const snapshot = await get(ref(db, `friendRequests/${currentUser.uid}`));
      if (snapshot.exists()) {
        setRequestList(Object.values(snapshot.val()));
      } else {
        setRequestList([]);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const snapshot = await get(
        ref(db, `notifications/chat/${currentUser.uid}`)
      );
      if (snapshot.exists()) {
        setMessagesList(Object.values(snapshot.val()));
      } else {
        setMessagesList([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostNotifications = async () => {
    setLoading(true);
    try {
      const snapshot = await get(
        ref(db, `notifications/posts/${currentUser.uid}`)
      );
      const newPost = [];

      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());

        for (const comment of data) {
          const nestedComments = Object.values(comment || {});

          for (const nestedComment of nestedComments) {
            const commentData = Object.values(nestedComment || {});

            await Promise.all(
              commentData
                .filter((item) => item)
                .map(async (item) => {
                  if (!item.uid || !item.postId) return;

                  newPost.push(item);
                })
            );
          }
        }
      }

      setPostList(newPost);
    } catch (error) {
      console.error("Error fetching post notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchFriendRequests();
    fetchMessages();
    fetchPostNotifications();
  }, [currentUser]);

  return { requestList, messagesList, postList, loading };
};

export default useNotificationList;
