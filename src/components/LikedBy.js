import React, { useEffect, useState, useRef } from "react";
import Placeholder from "./images/profile-placeholder-2.jpg";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  child,
  serverTimestamp,
} from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

const LikedBy = ({ postLikes, isLikedBy, setLikedByComponent }) => {
  const [profileData, setProfileData] = useState([]);
  const [hasSent, setHasSent] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const likedByRef = useRef();

  const fetchUserProfile = async () => {
    try {
      const dbRef = ref(getDatabase());
      const users = [];
      for (const userId of postLikes) {
        const snapshot = await get(child(dbRef, `users/${userId}`));
        if (snapshot.exists()) {
          const user = snapshot.val();
          const friendsSnapshot = await get(
            child(dbRef, `friendsList/${currentUser.uid}`)
          );
          const data = friendsSnapshot.val();
          let isFriend = data?.friends.includes(userId);
          console.log(isFriend);
          users.push({
            displayName: user.displayName,
            photoUrl: user.photoUrl || "",
            uid: user.uid,
            isFriend,
          });
        }
      }
      setProfileData(users);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [setLikedByComponent]);

  const handleFriendRequest = async (userId) => {
    if (!currentUser) return;
    const friendRequest = {
      uid: currentUser.uid,
      timestamp: serverTimestamp(),
    };
    try {
      const friendRequestRef = ref(getDatabase(), `friendRequests/${userId}`);
      const newFriendRequestRef = push(friendRequestRef);
      await set(newFriendRequestRef, friendRequest);
      setHasSent(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleClickOutside = (event) => {
    if (likedByRef.current && !likedByRef.current.contains(event.target)) {
      closeModal();
    }
  };

  const closeModal = () => {
    setAnimateOut(true);
    setTimeout(() => setLikedByComponent(false), 300);
  };

  useEffect(() => {
    if (isLikedBy) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLikedBy]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 w-full" />
      <div
        ref={likedByRef}
        className={`md:max-w-3xl z-20 mx-auto text-white fixed bottom-0 w-full pb-20 px-6 py-4 bg-neutral-950 rounded-t-3xl
          ${
            animateOut ? "animate-slide-out-bottom" : "animate-slide-in-bottom"
          }`}
      >
        <div className="text-xl mx-auto my-4 font-bold py-3 w-full flex flex-row justify-between">
          <h1>Likes</h1>
          <CloseOutlinedIcon onClick={closeModal} className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-2 min-h-[30vh] max-h-[70vh]">
          {profileData.length > 0 ? (
            profileData.map((user) => (
              <div
                key={user.uid}
                className="flex flex-row items-center gap-2 text-sm overflow-y-auto"
              >
                <img
                  alt="user-avatar"
                  src={user?.photoUrl || Placeholder}
                  className="w-10 rounded-full aspect-square object-cover cursor-pointer"
                />
                <div className="flex flex-row w-full justify-between text-xs items-center">
                  <h1
                    className="text-sm font-bold"
                    onClick={() => {
                      closeModal();
                      navigate(`/profile?userId=${user.uid}`);
                    }}
                  >
                    {user?.displayName}
                  </h1>
                  {!user.isFriend && user.uid !== currentUser.uid && (
                    <div className="border border-neutral-500 py-2 px-3 rounded-2xl">
                      {hasSent ? (
                        <p>Friend request has been sent.</p>
                      ) : (
                        <button onClick={() => handleFriendRequest(user.uid)}>
                          Send friend request
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No liked posts</p>
          )}
        </div>
      </div>
    </>
  );
};

export default LikedBy;
