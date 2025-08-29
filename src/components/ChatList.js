import React, { useEffect, useState } from "react";
import {
  ref,
  child,
  get,
  getDatabase,
  onValue,
  remove,
} from "firebase/database";
import { useStateValue } from "./contexts/StateProvider";
import { useSelector } from "react-redux";
import Placeholder from "./images/profile-placeholder-2.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import CreateGroupChat from "./CreateGroupChat";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

const ChatList = () => {
  const [chatList, setChatList] = useState([]);
  const [AllChatList, setAllChatList] = useState([]);
  const user = useSelector((state) => state.user.activeUser);
  const navigate = useNavigate();
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [onlineUserList, setOnlineUserList] = useState([]);
  const [notificationList, setNotificationList] = useState([]);
  const [onlineToggle, setOnlineToggle] = useState(false);
  const [notificationToggle, setNotificationToggle] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState([]);

  const [typingStatus, setTypingStatus] = useState({});
  const [groupChatToggle, setGroupChatToggle] = useState(false);

  const [chatListRecieverId, setChatListRecieverId] = useState(null);
  const [combinedChats, setCombinedChats] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const { currentUser } = useAuth();

  const [groupchats, setGroupchats] = useState([]);

  useEffect(() => {
    if (!user || !user.uid) return;

    const dbRef = ref(getDatabase(), "groupChat");
    const groupChatArray = [];
    const uniqueGroup = [];

    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((groupchat) => {
          const groupChatKey = groupchat.key;
          const groupChatData = groupchat.val();

          if (groupChatData.allowedUsers.includes(user.uid)) {
            if (!uniqueGroup.includes(groupChatKey)) {
              uniqueGroup.push(groupChatKey);
              groupChatArray.push({
                groupChatKey,
                ...groupChatData,
              });
            }
          }
        });
        setGroupchats(groupChatArray);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const deleteChat = async () => {
    const chatToDelete = ref(
      getDatabase(),
      `chatList/${user.uid}/${chatListRecieverId}`
    );
    try {
      await remove(chatToDelete).then(() => {});
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!user || !user.uid) return;

    const dbRef = ref(getDatabase(), `chatList/${user.uid}`);

    const unsubscribe = onValue(dbRef, async (snapshot) => {
      const chatPromises = [];
      snapshot.forEach((childSnapshot) => {
        const childData = childSnapshot.val();
        const userPromise = get(
          child(ref(getDatabase()), `users/${childData.receiverId}`)
        );
        const statusPromise = get(
          child(ref(getDatabase()), `status/${childData.receiverId}`)
        );
        const notificationsPromise = get(
          child(ref(getDatabase()), `chatList/${user.uid}/notifications`)
        );

        chatPromises.push(
          Promise.all([userPromise, statusPromise, notificationsPromise]).then(
            ([userSnapshot, statusSnapshot, notificationsSnapshot]) => {
              if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                const status = statusSnapshot.val();
                const notifications = notificationsSnapshot.exists()
                  ? notificationsSnapshot.val()
                  : {};
                const notificationsObj = notificationsSnapshot.val() || {};
                const notificationsArray = Object.keys(notificationsObj).map(
                  (key) => ({
                    id: key,
                    ...notificationsObj[key],
                  })
                );

                setUnreadMessages(notificationsArray);
                const { messages = {} } = notifications;
                return {
                  ...childData,
                  ...userData,
                  status,
                  messages,
                };
              }
              return null;
            }
          )
        );
      });

      try {
        const chatObjects = await Promise.all(chatPromises);
        const filteredChats = chatObjects.filter(Boolean);
        const sortedChats = filteredChats.sort((a, b) => b.sentAt - a.sentAt);
        setChatList(sortedChats);
        setAllChatList(sortedChats);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if ((!chatList.length && !groupchats.length) || !user) return;

    const db = getDatabase();
    const groupChatRef = ref(db, "groupChat");

    const unsubscribe = onValue(groupChatRef, (snapshot) => {
      const allGroupChats = snapshot.exists() ? snapshot.val() : {};

      // Merge single chats and group chats
      const merged = [
        ...chatList.map((chat) => ({
          ...chat,
          type: "single",
          status: userStatuses[chat.receiverId] || "Offline",
        })),
        ...groupchats.map((gc) => {
          const groupData = allGroupChats[gc.groupChatKey] || {};
          const lastMessage = groupData.lastMessage || {};

          return {
            ...gc,
            type: "group",
            chatId: gc.groupChatKey,
            displayName: gc.name,
            lastMessage: lastMessage.message || gc.latestMessage || "",
            sentAt: lastMessage.sentAt || gc.latestMessageSentAt || 0,
          };
        }),
      ];

      //  Add unread messages to corresponding chatId
      const mergedWithMessages = merged.map((chat) => {
        const unreadForChat = unreadMessages.find(
          (um) => um.id === chat.chatId
        );
        const messages = unreadForChat
          ? Object.values(unreadForChat.messages || {})
          : [];
        return {
          ...chat,
          messages,
        };
      });

      const sortedChats = mergedWithMessages.sort(
        (a, b) => (b.sentAt || 0) - (a.sentAt || 0)
      );

      setCombinedChats(sortedChats);
    });

    return () => unsubscribe();
  }, [chatList, groupchats, user, unreadMessages, userStatuses]);

  //Listener for updates on user status'
  useEffect(() => {
    const statusRef = ref(getDatabase(), "status");

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const allStatuses = snapshot.val() || {};
      const statuses = {};

      Object.keys(allStatuses).forEach((uid) => {
        const userStatus = allStatuses[uid];
        const isOnline = Object.values(userStatus).some(
          (device) => device.state === "Online"
        );
        statuses[uid] = isOnline ? "Online" : "Offline";
      });

      setUserStatuses(statuses);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const typingRef = ref(getDatabase(), `typingStatus`);

    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingData = {};
      snapshot.forEach((childSnapshot) => {
        const chatId = childSnapshot.key;
        childSnapshot.forEach((userSnapshot) => {
          const userId = userSnapshot.key;
          const isTyping = userSnapshot.val();
          if (isTyping) {
            typingData[chatId] = typingData[chatId] || [];
            typingData[chatId].push(userId);
          }
        });
      });
      setTypingStatus(typingData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const chatRef = ref(getDatabase(), `chatList/${user.uid}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const chatData = childSnapshot.val();
        // If isSeen property changes, update the corresponding chat in chatList
        setChatList((prevChatList) => {
          return prevChatList.map((chat) => {
            if (chat.chatId === chatData.chatId) {
              return { ...chat, isSeen: chatData.isSeen };
            }
            return chat;
          });
        });
      });
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!currentUser) return;

    const db = getDatabase();
    const statusRef = ref(db, "status");

    const unsubscribe = onValue(statusRef, (snapshot) => {
      const onlineUsersTemp = new Set();
      snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        const userStatus = childSnapshot.val();
        if (userStatus === "Online" && userId !== currentUser.uid) {
          onlineUsersTemp.add(userId);
        }
      });
      setOnlineUsers(onlineUsersTemp);
      setOnlineUsersCount(onlineUsersTemp.size);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // get onlnie users
  useEffect(() => {
    const onlineChats = AllChatList.filter((chat) =>
      onlineUsers.has(chat.receiverId)
    );
    setOnlineUserList(onlineUsers.size > 0 ? onlineChats : AllChatList);
  }, [onlineUsers, chatList]);

  // const handleOnlineFilter = () => {
  //   setNotificationToggle(false);
  //   setOnlineToggle(true);
  //   const onlineChats = AllChatList.filter((chat) =>
  //     onlineUsers.has(chat.receiverId)
  //   );
  //   setOnlineUserList(onlineUsers.size > 0 ? onlineChats : AllChatList);
  // };

  useEffect(() => {
    const chatsWithNotifications = AllChatList.filter(
      (chat) => chat.messages && Object.keys(chat.messages).length > 0
    );
    setNotificationList(chatsWithNotifications);
  }, [AllChatList]);

  function formatTimestamp(timestamp) {
    const timestampDate = new Date(timestamp);
    let hours = timestampDate.getHours();
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
    } else if (timestampDate >= startOfWeek && timestampDate <= todayStart) {
      const dayOfWeek = timestampDate.toLocaleString("en-US", {
        weekday: "long",
      });
      return `${dayOfWeek}`;
    } else {
      return timestampDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  const createGroupChatToggle = () => {
    setGroupChatToggle((prev) => !prev);
  };
  return (
    <>
      {groupChatToggle && (
        <CreateGroupChat createGroupChatToggle={createGroupChatToggle} />
      )}
      <h1 className="text-3xl font-extrabold px-2 py-5 text-white">
        Messages{" "}
      </h1>
      <div className="flex text-white flex-col pb-20 w-full">
        {/* <h1 className="text-3xl font-extrabold px-2 my-3">Messages </h1> */}
        <div className="flex flex-row items-center gap-2 mb-6">
          <div className="relative w-full px-1">
            <input
              className="w-full bg-neutral-900 h-10 pl-12 pr-4 rounded-full  outline-none"
              placeholder="Search"
            />
            <SearchRoundedIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        {combinedChats?.length > 0 &&
          combinedChats.map((chat, key) => (
            <div
              className={`group flex flex-row border-b border-neutral-900 px-4 py-3 text-sm transition-all duration-100
      active:bg-neutral-900
      md:hover:opacity-70
      hover:cursor-pointer
      ${
        Object.keys(chat?.messages || {}).length > 0
          ? `bg-neutral-900`
          : `bg-neutral-950`
      }`}
              key={key}
              data-userid={user.uid}
              onClick={() =>
                navigate(
                  chat.type === "single"
                    ? `/chats/${chat.chatId}`
                    : `/groupchat/${chat.groupChatKey}`
                )
              }
            >
              <div className="flex flex-row w-full  gap-2">
                <div className="flex flex-col relative">
                  <img
                    alt="user-avatar"
                    src={chat.photoUrl || Placeholder}
                    className="w-14 aspect-square rounded-full object-cover"
                  />
                  {chat.type === "single" && (
                    <div
                      className={`w-5 h-5 rounded-full absolute left-8 top-8 sm:left-9 sm:top-9 border-4 border-neutral-950
              ${chat.status === "Online" ? `bg-green-600` : "bg-neutral-800"}`}
                    ></div>
                  )}
                </div>
                <div className="flex flex-col space-y-1 w-full">
                  <div className="flex flex-row justify-between">
                    <h1 className="text-sm font-bold text-violet-400">
                      {chat.displayName}
                    </h1>
                    <span className="text-neutral-600 text-xs">
                      {formatTimestamp(chat?.sentAt)}
                    </span>
                  </div>

                  <div className="flex justify-between w-72 sm:w-full">
                    {typingStatus[chat.chatId]?.filter(
                      (userId) => userId !== currentUser.uid
                    ).length > 0 ? (
                      <span className="text-xs">
                        {typingStatus[chat.chatId]
                          .filter((userId) => userId !== currentUser.uid)
                          .map((userId) => {
                            const user = combinedChats.find(
                              (c) =>
                                c.receiverId === userId ||
                                c.admin?.includes(userId)
                            );
                            return user?.displayName || "Someone";
                          })
                          .join(", ")}{" "}
                        is typing...
                      </span>
                    ) : (
                      <span className="text-xs truncate flex-1 min-w-0">
                        {chat?.lastMessage || "No messages yet."}
                      </span>
                    )}

                    {Object.keys(chat?.messages || {}).length > 0 && (
                      <span className="rounded-full bg-violet-600 flex items-center justify-center w-4 h-4 text-xxs">
                        {Object.keys(chat?.messages || {}).length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {/* <GroupList /> */}
      </div>

      {combinedChats !== null && combinedChats.length === 0 && (
        <h1 className="text-white text-3xl"> No Messages.</h1>
      )}
    </>
  );
};

export default ChatList;
