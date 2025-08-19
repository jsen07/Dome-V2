import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useStateValue } from "./contexts/StateProvider";
import {
  serverTimestamp,
  ref,
  child,
  get,
  set,
  getDatabase,
  push,
  onValue,
  update,
  remove,
} from "firebase/database";
import ChatMessage from "./ChatMessage";
import Placeholder from "../components/images/profile-placeholder-2.jpg";
import EmojiPicker from "emoji-picker-react";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import SendIcon from "@mui/icons-material/Send";
import ChatInfo from "./ChatInfo";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { useNavigate } from "react-router-dom";

const GroupChat = () => {
  const [{ user }] = useStateValue();
  const [text, setText] = useState("");
  const [reciever, setReceiver] = useState();
  const [chat, setChat] = useState([]);
  const [seen, setSeen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isComponentActive, setIsComponentActive] = useState(false);

  const messagesEndRef = useRef(null);
  const seenEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { chatId } = useParams();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("Offline");
  const [emojiToggle, setEmojiToggle] = useState(false);
  const [lastMessage, setLastMessage] = useState();
  const [unseenMessages, setUnseenMessages] = useState({});
  const [chatInfoToggle, setChatInfoToggle] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  //groupchat variables
  const [groupChat, setGroupChat] = useState();

  const chatInfoToggleHnadler = () => {
    setChatInfoToggle((prev) => !prev);
  };

  useEffect(() => {
    setChatInfoToggle(false);
    setIsComponentActive(true);
    const chatRef = ref(getDatabase(), `groupChat/${chatId}`);
    onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGroupChat(data);
        setMembers(data.allowedUsers.filter((uid) => uid !== user.uid));
      }
    });
  }, [chatId]);

  function fetchChatData(chatId, user) {
    return new Promise((resolve, reject) => {
      const chatRef = ref(getDatabase());

      get(child(chatRef, `groupChat/${chatId}`))
        .then((snapshot) => {
          const data = snapshot.val();

          if (data) {
            setGroupChat(data);
            const allowedUsersArray = [...(data.allowedUsers || [])];
            const index = allowedUsersArray.indexOf(user.uid);

            if (index > -1) {
              allowedUsersArray.splice(index, 1);
              setReceiver(allowedUsersArray);
            }

            const messagesArray = Object.values(data.messages || {}).sort(
              (a, b) => a.serverTime - b.serverTime
            );

            setChat(messagesArray);

            resolve({
              allowedUsers: allowedUsersArray,
              messages: messagesArray,
            });
          } else {
            reject("No data found for the given chatId");
          }
        })
        .catch((error) => {
          reject(`Error fetching chat data: ${error.message}`);
        });
    });
  }

  useEffect(() => {
    setLoading(true);
    fetchChatData(chatId, user)
      .then((result) => {
        setChat(result.messages);

        setLoading(false);

        const chatRef = ref(getDatabase());
        const messagesRef = child(chatRef, `chat/${chatId}/messages`);

        const getNewMessage = onValue(messagesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const messagesArray = Object.values(data).sort(
              (a, b) => a.serverTime - b.serverTime
            );
            if (messagesArray[messagesArray.length - 1].chatId === chatId) {
              setChat(messagesArray);
              setLastMessage(messagesArray[messagesArray.length - 1]);

              if (messagesArray.length > result.messages.length) {
                const newMessage = messagesArray[messagesArray.length - 1];
                setLastMessage(newMessage);

                if (
                  newMessage.uid !== user.uid &&
                  newMessage.chatId === chatId
                ) {
                  if (newMessage.type === "group") {
                    // receiveSend.play();
                    // console.log('group message')
                  }
                }
              }
            }
          }
        });

        return () => getNewMessage();
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, [chatId, user.uid]);

  useEffect(() => {
    if (!user?.uid || !reciever || !chatId) return;
    const db = getDatabase();

    const messagesRef = ref(
      db,
      `chatList/${user.uid}/notifications/${chatId}/messages`
    );

    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      if (!snapshot.exists()) return;

      snapshot.forEach((msgSnap) => {
        const msg = msgSnap.val();
        console.log(msgSnap.val());
        if (msg.chatId === chatId) {
          remove(
            ref(
              db,
              `chatList/${user.uid}/notifications/${chatId}/messages/${msgSnap.key}`
            )
          ).catch(console.error);
        }
      });
    });

    return () => unsubscribe();
  }, [user?.uid, reciever, chatId]);

  const sendMessage = () => {
    if (text === "") {
      return;
    }

    const chatRef = ref(getDatabase());

    const db = getDatabase();

    const postMessagesRef = ref(db, `chat/${chatId}/messages`);
    const groupLastMessageRef = ref(db, `groupChat/${chatId}/lastMessage`);

    members.forEach((member) => {
      const notifiChatListRef = ref(
        db,
        `chatList/${member}/notifications/${chatId}/messages`
      );

      const newChatNotifRef = push(notifiChatListRef);
      set(newChatNotifRef, {
        message: text,
        displayName: user.displayName,
        sentAt: serverTimestamp(),
        isSeen: false,
        chatId: chatId,
      });
    });
    const newPostRef = push(postMessagesRef);
    const UserMessage = `${user.displayName}: ${text}`;
    set(newPostRef, {
      serverTime: serverTimestamp(),
      sentAt: serverTimestamp(),
      message: text,
      displayName: user.displayName,
      photoUrl: user.photoURL,
      uid: user.uid,
      chatId: chatId,
      type: "group",
    });

    set(groupLastMessageRef, {
      sentAt: serverTimestamp(),
      message: UserMessage,
      displayName: user.displayName,
      uid: user.uid,
    });

    const notificationRef = ref(
      db,
      `notifications/chat/${reciever}/${user.uid}`
    );
    set(notificationRef, {
      timestamp: serverTimestamp(),
      chatId: chatId,
      recieverId: user.uid,
    });

    const input = document.getElementById("send-message__input");

    setText("");
    input.value = "";
    notifyTyping(chatId, user.uid, false);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      if (!seenEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      } else {
        seenEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom =
      container.scrollHeight - container.scrollTop === container.clientHeight;
    setIsAtBottom(isAtBottom);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);

    return () => clearTimeout(timer);
  }, [chat, seen]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };
  const emojiToggleHandler = () => {
    setEmojiToggle(!emojiToggle);
  };

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setEmojiToggle(!emojiToggle);
    inputRef.current.focus();
  };

  const generateMessages = () => {
    const dateMap = {};

    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
    );

    const today = now.toISOString().split("T")[0];
    const startOfWeekString = startOfWeek.toISOString().split("T")[0];

    // Group messages by date
    chat.forEach((chatData) => {
      if (chatData.chatId !== chatId) return;

      const timestamp = chatData.sentAt;
      if (!timestamp) return;

      const date = new Date(timestamp);
      if (isNaN(date)) {
        console.error("Invalid date:", timestamp);
        return;
      }

      const dateString = date.toISOString().split("T")[0];

      if (!dateMap[dateString]) {
        dateMap[dateString] = { label: dateString, messages: [] };
      }

      if (dateString === today) {
        dateMap[dateString].label = "Today";
      } else if (dateString >= startOfWeekString && dateString <= today) {
        dateMap[dateString].label = date.toLocaleString("en-US", {
          weekday: "long",
        });
      } else {
        dateMap[dateString].label = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      dateMap[dateString].messages.push(chatData);
    });

    // Reverse dates so the latest date is first for flex-col-reverse
    const reversedDates = Object.keys(dateMap).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    return reversedDates.map((date) => (
      <div
        key={date}
        className="w-full flex flex-col gap-4 rounded-lg py-4 px-2 shadow-sm"
      >
        <div className="flex justify-center">
          <div className="bg-neutral-900 px-4 py-1 rounded-full text-sm text-neutral-400">
            <h4>{dateMap[date].label}</h4>
          </div>
        </div>

        {dateMap[date].messages.map((message, index) => {
          const isUserMessage = message.uid === user?.uid;
          const isFirstMessageOfDay =
            index === 0 ||
            message.uid !== dateMap[date].messages[index - 1].uid;

          const previousTimestamp =
            index > 0 ? dateMap[date].messages[index - 1].sentAt : null;
          const currentTimestamp = message.sentAt;

          const timeDifference = previousTimestamp
            ? (currentTimestamp - previousTimestamp) / (1000 * 60)
            : 0;

          const shouldShowDisplayName =
            isFirstMessageOfDay ||
            timeDifference >= 15 ||
            message.uid !== dateMap[date].messages[index - 1].uid;

          return (
            <div
              key={`${message.id}-${message.sentAt}`}
              className={`flex flex-col ${
                isUserMessage ? "items-end" : "items-start"
              }`}
            >
              {shouldShowDisplayName && (
                <div
                  className={`flex flex-row gap-2 items-center text-xxs mb-1 ${
                    isUserMessage ? "items-end" : "items-start"
                  }`}
                >
                  {isUserMessage ? (
                    <>
                      <span className="text-gray-400">
                        {HeaderformatTimestamp(message.sentAt)}
                      </span>
                      <span className="font-semibold text-sm text-white">
                        {message.displayName}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-sm text-white">
                        {message.displayName}
                      </span>
                      <span className="text-gray-400">
                        {HeaderformatTimestamp(message.sentAt)}
                      </span>
                    </>
                  )}
                </div>
              )}

              <ChatMessage
                data={message}
                isFirstMessageOfDay={isFirstMessageOfDay}
                shouldShowDisplayName={shouldShowDisplayName}
              />
            </div>
          );
        })}
      </div>
    ));
  };

  function HeaderformatTimestamp(timestamp) {
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
    const dayOfWeek = timestampDate.toLocaleString("en-US", {
      weekday: "long",
    });

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
      return `Today at ${timeOfMessage}`;
    } else if (timestampDate >= yesterdayStart) {
      return `Yesterday at ${timeOfMessage}`;
    } else if (timestampDate >= startOfWeek && timestampDate <= todayStart) {
      return `${dayOfWeek} at ${timeOfMessage}`;
    } else {
      // return `${dayOfWeek}, ${timestampDate.toLocaleDateString("en-US", {
      //   year: "numeric",
      //   month: "long",
      //   day: "numeric",
      // })} at ${timeOfMessage}`;
      return `${dayOfWeek} at ${timeOfMessage}`;
    }
  }

  const notifyTyping = (chatId, userId, typing, displayName) => {
    set(ref(getDatabase(), `typingStatus/${chatId}/${userId}`), typing);
  };

  const handleInputChange = (e) => {
    setText(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (!isTyping) {
      setIsTyping(true);
      notifyTyping(chatId, user.uid, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      notifyTyping(chatId, user.uid, false);
    }, 1000);
  };
  useEffect(() => {
    const typingRef = ref(getDatabase(), `typingStatus/${chatId}`);
    const unsubscribe = onValue(typingRef, async (snapshot) => {
      const usersTyping = {};

      const typingData = snapshot.val();
      if (typingData) {
        for (const userId in typingData) {
          if (typingData[userId]) {
            if (reciever && reciever.includes(userId)) {
              try {
                const displayName = await getUserDisplayName(userId);
                if (displayName) {
                  usersTyping[userId] = displayName;
                }
              } catch (error) {
                console.error(
                  "Error fetching displayName for user:",
                  userId,
                  error
                );
              }
            }
          }
        }
      }
      setTypingUsers(usersTyping);
    });

    return () => unsubscribe();
  }, [chatId, reciever]);

  const getUserDisplayName = async (userId) => {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);

    try {
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val().displayName;
      }
    } catch (error) {
      console.error("Error fetching user displayName:", error);
      return null;
    }
  };

  return (
    <div
      className={`h-screen w-full absolute top-0 left-0 flex flex-col 
        bg-neutral-950 ${isComponentActive ? "active" : ""}`}
    >
      {/* <button onClick={closeChat}> Close Chat</button> */}
      <div className="fixed bg-neutral-950 top-0 text-white border-neutral-900 px-4 py-2 h-20 flex flex-row items-center gap-2 text-base z-20 w-full border-b">
        <ArrowBackIosNewRoundedIcon
          onClick={() => navigate(-1)}
          className="cursor-pointer hover:opacity-80"
        />
        <div className="relative pl-2" onClick={chatInfoToggleHnadler}>
          <img
            alt="user-avatar"
            src={groupChat?.photoUrl || Placeholder}
            className="w-12 aspect-square rounded-full object-cover"
          />
        </div>

        <div className="flex flex-row justify-between grow items-center">
          <h1 className="text-base font-extrabold"> {groupChat?.name}</h1>
          <p> {groupChat?.allowedUsers.length} members </p>
        </div>
      </div>

      <div className="py-20 flex flex-col h-screen w-full relative">
        {loading && <div className="loading"></div>}

        <div
          className="flex flex-col h-screen py-20"
          ref={messagesContainerRef}
        >
          <div className="flex-1 flex flex-col-reverse overflow-y-auto">
            <div className="flex flex-col text-white text-sm h-6 px-4 font-bold">
              <div className="bg-neutral-950 h-6 w-full">
                {Object.keys(typingUsers).length > 0 &&
                  Object.keys(typingUsers).map((userId, index) => {
                    return (
                      <p key={index}>{typingUsers[userId]} is typing...</p>
                    );
                  })}
              </div>

              {seen && Object.keys(typingUsers).length === 0 && (
                <span
                  className="w-full flex justify-end text-xs py-2"
                  ref={seenEndRef}
                >
                  {" "}
                  Seen{" "}
                </span>
              )}
            </div>
            {generateMessages()}
            {/* {chat.length === 0 && <p>No messages</p>} */}
          </div>
          <div ref={messagesEndRef} />
        </div>
        <div className="fixed h-20 bottom-0 left-0 border-t border-neutral-900 w-full bg-neutral-950 pt-2 pb-7 px-3 flex items-center gap-3">
          {/* <EmojiEmotionsOutlinedIcon
            className="emoji-button"
            onClick={emojiToggleHandler}
          />
          <div className="emoji-picker__container">
            <EmojiPicker
              open={emojiToggle}
              emojiStyle="native"
              onEmojiClick={handleEmoji}
              theme="dark"
              height={400}
              width={400}
            />
          </div> */}
          <input
            id="send-message__input"
            placeholder="Type a message..."
            type="text"
            ref={inputRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className="w-full rounded-full px-4 py-2 bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:border-violet-400"
          />
          <button
            id="send-button"
            onClick={sendMessage}
            className="pb-1 flex items-center text-violet-400 hover:text-violet-500 transition-colors"
          >
            <SendIcon className="rotate-[-30deg]" />
          </button>
        </div>
      </div>

      {/* <div className={`chat-info ${chatInfoToggle ? "active" : ""}`}>
        {chatInfoToggle && <ChatInfo groupChat={groupChat} />}
      </div> */}
    </div>
  );
};

export default GroupChat;
