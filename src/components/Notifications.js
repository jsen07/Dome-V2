import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "./hooks/useUserProfile";
import Placeholder from "./images/profile-placeholder-2.jpg";
import NotifSkeleton from "./loaders/Skeletons/NotifSkeleton";
import {
  ref,
  child,
  get,
  getDatabase,
  remove,
  set,
  onValue,
} from "firebase/database";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

const Notifications = () => {
  const user = useSelector((state) => state.user.activeUser);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [requestList, setRequestList] = useState([]);
  const [postList, setPostList] = useState([]);
  const [messagesList, setMessagesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mergedAndSortedList, setMergedAndSortedList] = useState([]);
  const [isSorted, setIsSorted] = useState(false);

  function formatTimestamp(timestamp) {
    const timestampDate = new Date(timestamp);
    let hours = timestampDate.getHours(); // Get hours
    const minutes = timestampDate.getMinutes();
    let dayOrNight = "";
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
    );

    if (hours >= 12) {
      dayOrNight = "PM";
    }
    if (hours === 0 || hours < 12) {
      dayOrNight = "AM";
    }
    if (hours === 0) {
      hours = 12;
    }

    const timeOfMessage = `${hours}:${String(minutes).padStart(
      2,
      "0"
    )} ${dayOrNight}`;
    if (timestampDate >= todayStart) {
      return timeOfMessage;
    } else if (timestampDate >= yesterdayStart) {
      return "Yesterday";
    } else if (timestampDate >= startOfWeek) {
      const dayOfWeek = timestampDate.toLocaleString("en-US", {
        weekday: "long",
      });
      return `${dayOfWeek} at ${timeOfMessage}`;
    } else {
      return timestampDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  // GET USER FRIEND REQUESTS
  const checkForFriendRequests = async () => {
    try {
      setLoading(true);
      const friendsRef = ref(getDatabase());
      const snapshot = await get(
        child(friendsRef, `friendRequests/${user.uid}`)
      );

      if (snapshot.exists()) {
        const data = snapshot.val();
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error checking friends:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const friendsRef = ref(getDatabase(), `friendRequests/${user.uid}`);
    onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setRequestList(data);
      } else {
        setRequestList([]);
      }
    });
  }, []);

  const getRequestList = async () => {
    const requests = await checkForFriendRequests();
    if (requests !== null) {
      const requestArray = Object.values(requests);
      setRequestList(requestArray);
    } else {
      setRequestList([]);
    }
  };

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
      } else {
        console.log("no friend requests");
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

      // 1. Get current friends arrays
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

  const checkForMessages = async () => {
    try {
      setLoading(true);
      const dbRef = ref(getDatabase());
      const snapshot = await get(
        child(dbRef, `notifications/chat/${currentUser.uid}`)
      );
      let newMessageNotifs = [];
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());

        for (const message of data) {
          newMessageNotifs.push(message);
        }
      }
      return newMessageNotifs;
    } catch (error) {
      console.error("Error checking friends:", error);
    } finally {
      setLoading(false);
    }
  };
  const getMessagesList = async () => {
    const requests = await checkForMessages();
    if (requests !== null) {
      const requestArray = Object.values(requests);
      setMessagesList(requestArray);
    } else {
      setMessagesList([]);
    }
  };

  useEffect(() => {
    const notifRef = ref(
      getDatabase(),
      `notifications/chat/${currentUser.uid}`
    );
    onValue(notifRef, async (snapshot) => {
      let newMessageNotifs = [];
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());

        for (const message of data) {
          newMessageNotifs.push(message);
        }
        setMessagesList(newMessageNotifs);
      }
    });
  }, []);

  useEffect(() => {
    const dbRef = ref(getDatabase());
    const postRef = ref(
      getDatabase(),
      `notifications/posts/${currentUser.uid}`
    );
    let newPost = [];

    onValue(postRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());

        for (const comment of data) {
          const newComment = Object.values(comment);
          for (const nestedComment of newComment) {
            const commentData = Object.values(nestedComment);
            // console.log(commentData)

            const userPromises = commentData.map(async (data) => {
              const snap = await get(child(dbRef, `users/${data.uid}`));
              if (snap.exists()) {
                // console.log(data)
                const snapshot = await get(
                  child(dbRef, `Posts/${data.postId}`)
                );
                const userDetails = snap.val();
                if (snapshot.exists()) {
                  const postData = snapshot.val();
                  newPost.push({
                    ...data,
                    imageUrl: postData?.imageUrl || "",
                    post: postData?.post || "",
                    displayName: userDetails.displayName,
                  });
                }
              }
            });
            await Promise.all(userPromises);
          }
        }
      }
      setPostList(newPost);
    });
  }, [currentUser]);

  const NewCommentsOnPosts = ({
    comment,
    post,
    postId,
    timestamp,
    uid,
    caption,
    image,
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
                <p className="text-neutral-100 text-sm">
                  {userDetails.displayName} has commented
                  {post ? <span> on your post: {post} </span> : ""}{" "}
                </p>

                {/* {imageUrl && (
                  <div className="image-notif__container">
                    <img
                      src={userDetails?.photoUrl || Placeholder}
                      alt="image-post"
                    />
                  </div>
                )} */}
                <div className="flex flex-row justify-between items-center gap-2">
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

  useEffect(() => {
    //combine lists and sort
    const combinedList = [
      ...requestList.map((item) => ({ ...item, type: "request" })),
      ...postList.map((item) => ({ ...item, type: "post" })),
      ...messagesList.map((item) => ({ ...item, type: "message" })),
    ];

    combinedList.sort((a, b) => b.timestamp - a.timestamp);

    setMergedAndSortedList(combinedList);
    setIsSorted(true);
  }, [requestList, postList, messagesList]);

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
        {mergedAndSortedList.length === 0 && !loading && isSorted ? (
          <p className="text-neutral-400 text-center py-4">
            You're up to date 🌝
          </p>
        ) : (
          mergedAndSortedList.map((item) => {
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
                    imageUrl={item.imageUrl}
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
