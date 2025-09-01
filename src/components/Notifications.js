import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "./hooks/useUserProfile";
import Placeholder from "./images/profile-placeholder-2.jpg";
import NotifSkeleton from "./loaders/Skeletons/NotifSkeleton";
import { useNotifications } from "./hooks/useNotificationList";
import { ref, child, get, getDatabase, remove, set } from "firebase/database";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { formatTimestamp } from "./helpers/timeFormatter";

const Notifications = () => {
  const user = useSelector((state) => state.user.activeUser);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  // const [requestList, setRequestList] = useState([]);
  // const [postList, setPostList] = useState([]);
  // const [messagesList, setMessagesList] = useState([]);
  // const [loading, setLoading] = useState(false);
  // const [mergedAndSortedList, setMergedAndSortedList] = useState([]);

  const { requestList, notifications, loading, setRequestList } =
    useNotifications();

  const handleReject = async (userId) => {
    try {
      const friendsRef = ref(getDatabase());
      const snapshot = await get(
        child(friendsRef, `friendRequests/${currentUser.uid}`)
      );

      if (snapshot.exists()) {
        const data = snapshot.val();
        const requests = Object.values(data);
        const filtered = requests.filter((data) => data.uid !== userId);

        if (filtered.length === 0) {
          await remove(child(friendsRef, `friendRequests/${currentUser.uid}`));
        } else {
          await set(
            child(friendsRef, `friendRequests/${currentUser.uid}`),
            filtered
          );
        }
        setRequestList(filtered);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAccept = async (userId, displayName, photoURL) => {
    try {
      const db = getDatabase();

      const currentUserFriendsRef = ref(
        db,
        `friendsList/${currentUser.uid}/friends`
      );
      const receiverFriendsRef = ref(db, `friendsList/${userId}/friends`);
      const friendRequestsRef = ref(db, `friendRequests/${currentUser.uid}`);

      const currentUserSnapshot = await get(currentUserFriendsRef);
      const receiverSnapshot = await get(receiverFriendsRef);

      const currentUserFriends = currentUserSnapshot.exists()
        ? currentUserSnapshot.val()
        : [];
      const receiverFriends = receiverSnapshot.exists()
        ? receiverSnapshot.val()
        : [];

      if (!currentUserFriends.includes(userId)) {
        currentUserFriends.push(userId);
      }
      if (!receiverFriends.includes(currentUser.uid)) {
        receiverFriends.push(currentUser.uid);
      }

      await set(currentUserFriendsRef, currentUserFriends);
      await set(receiverFriendsRef, receiverFriends);

      const requestListArray = Object.values(requestList);
      const filteredRequestList = requestListArray.filter(
        (data) => data.uid !== userId
      );

      await set(friendRequestsRef, filteredRequestList);
      setRequestList(filteredRequestList);
    } catch (error) {
      console.log(error);
    }
  };

  const NewCommentsOnPosts = ({
    comment,
    post,
    postId,
    timestamp,
    uid,
    caption,
    imageUrl,
  }) => {
    const { userDetails, UserProfileLoading, error } = useUserProfile(uid);

    return (
      <>
        {userDetails && !UserProfileLoading && (
          <div key={postId} className="flex flex-col px-2 py-4 bg-neutral-900">
            <div className="flex flex-row gap-3 items-center">
              <div className="w-12 h-12">
                <img
                  alt="user-avatar"
                  src={userDetails?.photoUrl || Placeholder}
                  className="w-full h-full aspect-square rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex flex-row justify-between grow">
                  <div className="flex flex-row items-center grow flex-wrap text-neutral-100 text-sm">
                    <p className="text-wrap grow">
                      <span className="font-medium">
                        {userDetails.displayName}
                      </span>{" "}
                      has commented on your post:{" "}
                      <span className="overflow-hidden truncate">
                        {caption}
                      </span>
                    </p>
                  </div>
                  {imageUrl && (
                    <img
                      alt="user-avatar"
                      src={imageUrl || Placeholder}
                      className="w-12 h-12 aspect-square rounded-xl ml-1 object-cover"
                    />
                  )}
                </div>

                {/* {imageUrl && (
                  <div className="image-notif__container">
                    <img
                      src={userDetails?.photoUrl || Placeholder}
                      alt="image-post"
                    />
                  </div>
                )} */}
                <div className="flex flex-row justify-between items-center gap-2 ">
                  <div className="flex flex-row gap-2">
                    <button
                      className="bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors duration-200"
                      // onClick={() => navigate(`/chats/${chatId}`)}
                    >
                      Go to Post
                    </button>
                    <button className="border border-neutral-600 text-neutral-200 hover:bg-neutral-800 hover:text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors duration-200">
                      Close
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 mb-2 self-end">
                    {formatTimestamp(timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  const NewMessages = ({ chatId, timestamp, recieverId }) => {
    const { userDetails, UserProfileLoading, error } =
      useUserProfile(recieverId);
    return (
      <>
        {userDetails && !UserProfileLoading && (
          <div key={chatId} className="flex flex-col px-2 py-4 bg-neutral-900">
            <div className="flex flex-row gap-3 items-center">
              <div className="w-12 h-12">
                <img
                  alt="user-avatar"
                  src={userDetails?.photoUrl || Placeholder}
                  className="w-full h-full aspect-square rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-neutral-100 text-sm">
                  You have a new message from{" "}
                  <span className="font-semibold">
                    {userDetails?.displayName}.
                  </span>
                </p>

                <div className="flex flex-row justify-between gap-2">
                  <div className="flex flex-row gap-2">
                    <button
                      className="bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors duration-200"
                      onClick={() => navigate(`/chats/${chatId}`)}
                    >
                      Go to message
                    </button>
                    <button className="border border-neutral-600 text-neutral-200 hover:bg-neutral-800 hover:text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors duration-200">
                      Close
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 mb-2 self-end">
                    {formatTimestamp(timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const NewRequests = ({ uid, displayName, timestamp, photoUrl }) => {
    const { userDetails, UserProfileLoading, error } = useUserProfile(uid);
    return (
      <>
        {userDetails && !UserProfileLoading && (
          <div key={uid} className="flex flex-col px-2 py-4 bg-neutral-900">
            <div className="flex flex-row  gap-3 items-center">
              <div className="w-12 h-12">
                <img
                  alt="user-avatar"
                  src={userDetails?.photoUrl || Placeholder}
                  className="w-full h-full aspect-square rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="text-neutral-100 text-sm">
                  <span className="font-semibold">
                    {userDetails?.displayName}
                  </span>{" "}
                  has sent you a friend request.
                </p>

                <div className="flex flex-row justify-between gap-2">
                  <div className="flex flex-row gap-2">
                    <button
                      className="bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors duration-200"
                      onClick={() =>
                        handleAccept(uid, displayName, photoUrl || "")
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="border border-neutral-600 text-neutral-200 hover:bg-neutral-800 hover:text-white text-xs font-medium py-1 px-3 rounded-lg transition-colors duration-200"
                      onClick={() => handleReject(uid)}
                    >
                      Reject
                    </button>
                  </div>
                  <div className="text-xs text-neutral-500 mb-2 self-end">
                    {formatTimestamp(timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-4 bg-neutral-950 rounded-2xl text-neutral-100">
      <div className="absolute top-0 text-white px-4 py-2 h-20 flex flex-row items-center gap-2 text-base z-20 w-full">
        <ArrowBackIosNewRoundedIcon
          onClick={() => navigate(-1)}
          className="cursor-pointer hover:opacity-80"
        />
      </div>
      <div className="flex items-center pb-2 mb-4 mt-20">
        <h1 className="text-2xl px-2 font-semibold">Notifications</h1>
      </div>
      <p className="w-full text-center pb-4">I'm still working on this 😔</p>

      <div className="flex flex-col">
        {notifications.length === 0 && !loading ? (
          <p className="text-neutral-400 text-center py-4">
            You're up to date 🌝
          </p>
        ) : (
          notifications.map((item) => {
            switch (item.type) {
              case "request":
                return (
                  <NewRequests
                    key={item.uid}
                    uid={item.uid}
                    displayName={item.displayName}
                    timestamp={item.timestamp}
                    photoUrl={item.photoUrl}
                  />
                );
              case "post":
                return (
                  <NewCommentsOnPosts
                    key={item.postId}
                    comment={item.comment}
                    displayName={item.displayName}
                    imageUrl={item.image}
                    caption={item.caption}
                    post={item.post}
                    postId={item.postId}
                    timestamp={item.timestamp}
                    type={item.type}
                    uid={item.uid}
                  />
                );
              case "message":
                return (
                  <NewMessages
                    key={item.chatId}
                    chatId={item.chatId}
                    recieverId={item.recieverId}
                    timestamp={item.timestamp}
                  />
                );
              default:
                return null;
            }
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
