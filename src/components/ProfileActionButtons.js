import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import {
  ref,
  set,
  child,
  get,
  getDatabase,
  serverTimestamp,
  push,
} from "firebase/database";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useCheckFriendship from "./hooks/useCheckFriendship";

const ProfileActionButtons = ({ userDetails }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [hasSent, setHasSent] = useState(false);

  const { isFriends } = useCheckFriendship(currentUser?.uid, userDetails?.uid);

  const createChat = async () => {
    const db = getDatabase();
    const chatId = generateChatId(currentUser.uid, userDetails.uid);

    try {
      const chatSnapshot = await get(child(ref(db), `chat/${chatId}`));

      if (!chatSnapshot.exists()) {
        const chatData = {
          createdAt: serverTimestamp(),
          messages: {},
          allowedUsers: [currentUser.uid, userDetails.uid],
        };

        await set(ref(db, `chat/${chatId}`), chatData);
      }

      navigate(`/chats/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to create chat. Please try again.");
    }
  };

  const generateChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
  };

  const handleFriendRequest = async () => {
    if (!currentUser) return;
    // done rely on hardcoded displayname as it can change if the user updates profile
    const friendRequest = {
      uid: currentUser.uid,
      photoUrl: currentUser.photoURL,
      timestamp: serverTimestamp(),
    };
    try {
      const friendRequestRef = ref(
        getDatabase(),
        `friendRequests/${userDetails?.uid}`
      );
      const newFriendRequestRef = push(friendRequestRef);

      await set(newFriendRequestRef, friendRequest);
      setHasSent(true);
    } catch (error) {
      console.log(error);
    }
  };

  const getFriendRequests = async () => {
    if (currentUser.uid === userDetails?.uid) {
      return;
    }
    try {
      const friendRequestRef = ref(getDatabase());
      const snapshot = await get(
        child(friendRequestRef, `friendRequests/${userDetails?.uid}`)
      );

      const data = snapshot.val();
      if (data) {
        const requestsArray = Object.values(data);
        const hasSentRequest = requestsArray.some(
          (request) => request.uid === currentUser.uid
        );
        setHasSent(hasSentRequest);
      } else {
        setHasSent(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // const friendsCheck = async () => {
  //   try {
  //     const friendsRef = ref(getDatabase());
  //     const snapshot = await get(
  //       child(friendsRef, `friendsList/${userDetails?.uid}/${currentUser.uid}`)
  //     );

  //     if (snapshot.exists()) {
  //       setIsFriends(true);
  //       return true;
  //     } else {
  //       setIsFriends(false);
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error("Error checking friendship status:", error);
  //   }
  // };
  useEffect(() => {
    if (!currentUser || !userDetails) return;
    const checkFriends = async () => {
      try {
        if (!isFriends) {
          await getFriendRequests();
        }
      } catch (error) {
        console.error("Error in checking friendship:", error);
      }
    };

    checkFriends();
  }, [currentUser, userDetails]);

  if (!currentUser || !userDetails) return null;

  return (
    <div className="absolute top-2 right-2 flex flex-row items-center gap-1  text-sm">
      {isFriends ? (
        <button
          className="border bg-neutral-900 border-neutral-800 font-bold text-sm px-3 py-1 text-white rounded-2xl shadow-md flex flex-row items-center gap-1"
          onClick={createChat}
        >
          {" "}
          Message
        </button>
      ) : (
        <>
          {hasSent ? (
            <p className="border bg-neutral-900 border-neutral-800 font-bold text-xs px-3 py-2 text-white rounded-2xl shadow-md flex flex-row items-center justify-center">
              Friend request sent.
            </p>
          ) : (
            // <button onClick={handleFriendRequest}>Send friend request</button>
            <>
              <button
                className="border bg-neutral-900 border-neutral-800 font-bold text-xs px-3 py-2 text-white rounded-2xl shadow-md flex flex-row items-center justify-center"
                onClick={handleFriendRequest}
              >
                Send friend request
              </button>
              {/* <button
                className="border bg-neutral-900 border-neutral-800 font-bold text-xs px-3 py-2 text-white rounded-2xl shadow-md flex flex-row items-center"
                onClick={createChat}
              >
                {" "}
                Message
              </button> */}
            </>
          )}
          <button
            className="border bg-neutral-900 border-neutral-800 font-bold text-sm px-3 py-1 text-white rounded-2xl shadow-md flex flex-row items-center gap-1"
            onClick={createChat}
          >
            {" "}
            Message
          </button>
        </>
      )}
    </div>
  );
};

export default ProfileActionButtons;
