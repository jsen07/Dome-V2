import React, { useState, useEffect } from "react";
import { useStateValue } from "./contexts/StateProvider";
import { useAuth } from "./contexts/AuthContext";
import { ref, child, get, getDatabase, onValue } from "firebase/database";

const ActiveNotifications = () => {
  const [{ user }] = useStateValue();
  const { currentUser } = useAuth();
  const [requestNotifs, setRequestNotifs] = useState("");
  const [messageNotifs, setMessageNotifs] = useState("");
  const [postNotifs, setPostNotifs] = useState("");
  const [combinedList, setCombinedList] = useState(0);

  useEffect(() => {
    const friendsRef = ref(getDatabase(), `friendRequests/${user.uid}`);
    onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setRequestNotifs(data.length);
      } else {
        setRequestNotifs(0);
      }
    });
  }, [currentUser]);
  useEffect(() => {
    const chatListRef = ref(getDatabase(), `notifications/chat/${user.uid}`);
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
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());

        for (const comment of data) {
          const newComment = Object.values(comment);
          for (const nestedComment of newComment) {
            const commentData = Object.values(nestedComment);

            const userPromises = commentData.map(async (data) => {
              const snap = await get(child(dbRef, `users/${data.uid}`));
              if (snap.exists()) {
                // console.log(snap.val());
                newCommentsLength += 1;
              }
            });
            await Promise.all(userPromises);
          }
        }
      }
      setPostNotifs(newCommentsLength);
      newCommentsLength = 0;
    });
  }, [currentUser]);

  useEffect(() => {
    if (requestNotifs > 0 || messageNotifs > 0 || postNotifs > 0) {
      let combinedLength = requestNotifs + messageNotifs + postNotifs;

      setCombinedList(combinedLength);
    }
  }, [requestNotifs, messageNotifs, postNotifs]);
  return (
    <>
      {combinedList > 0 && (
        <span className="border-4 p-2 border-neutral-900 text-white rounded-full w-4 h-4 bg-violet-600 text-xs flex items-center justify-center absolute bottom-3 left-3">
          {combinedList}
        </span>
      )}
    </>
  );
};

export default ActiveNotifications;
