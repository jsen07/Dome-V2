import React, { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { ref, child, get, getDatabase, onValue } from "firebase/database";

const ActiveNotifications = ({ getNotification }) => {
  const { currentUser } = useAuth();
  const [requestNotifs, setRequestNotifs] = useState("");
  const [messageNotifs, setMessageNotifs] = useState("");
  const [postNotifs, setPostNotifs] = useState("");
  const [combinedList, setCombinedList] = useState(0);

  useEffect(() => {
    const friendsRef = ref(getDatabase(), `friendRequests/${currentUser.uid}`);
    onValue(friendsRef, (snapshot) => {
      const count = snapshot.exists()
        ? Object.values(snapshot.val()).length
        : 0;
      setRequestNotifs(count);
      if (getNotification) getNotification(count + messageNotifs + postNotifs);
    });
  }, [currentUser]);
  useEffect(() => {
    const chatListRef = ref(
      getDatabase(),
      `notifications/chat/${currentUser.uid}`
    );
    onValue(chatListRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setMessageNotifs(data.length);
      } else {
        setMessageNotifs(0);
      }
    });
  }, [currentUser]);

  useEffect(() => {
    const dbRef = ref(getDatabase());
    const postRef = ref(
      getDatabase(),
      `notifications/posts/${currentUser.uid}`
    );

    let newCommentsLength = 0;
    onValue(postRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setPostNotifs(0);
        if (getNotification) getNotification(requestNotifs + messageNotifs + 0);
        return;
      }

      const data = Object.values(snapshot.val());
      let count = 0;

      const promises = data.flatMap((comment) =>
        Object.values(comment).flatMap((nested) =>
          Object.values(nested).map(async (c) => {
            const snap = await get(child(dbRef, `users/${c.uid}`));
            if (snap.exists()) count += 1;
          })
        )
      );

      await Promise.all(promises);
      setPostNotifs(count);

      // Notify parent after async work is done
      if (getNotification)
        getNotification(requestNotifs + messageNotifs + count);
    });
  }, [currentUser]);

  useEffect(() => {
    if (requestNotifs > 0 || messageNotifs > 0 || postNotifs > 0) {
      let combinedLength = requestNotifs + messageNotifs + postNotifs;

      setCombinedList(combinedLength);
      if (getNotification) getNotification(combinedLength);
    }
    console.log(requestNotifs);
  }, [requestNotifs, messageNotifs, postNotifs]);

  console.log(combinedList);
  return (
    <>
      {combinedList > 0 && (
        <span className="z-10 border-4 p-2 border-neutral-900 text-white rounded-full w-4 h-4 bg-violet-600 text-xs flex items-center justify-center absolute right-5 top-2">
          {combinedList}
        </span>
      )}
    </>
  );
};

export default ActiveNotifications;
