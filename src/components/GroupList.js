import React, { useEffect, useState } from "react";
import { useStateValue } from "./contexts/StateProvider";
import { ref, getDatabase, onValue } from "firebase/database";
import Placeholder from "./images/profile-placeholder-2.jpg";
import { useNavigate } from "react-router-dom";

const GroupList = () => {
  const [{ user }] = useStateValue();
  const [groupchats, setGroupchats] = useState([]);
  const navigate = useNavigate();

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
      } else {
        console.log("No data found");
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (groupchats.length === 0 || !user) return;

    const db = getDatabase();
    const groupChatRef = ref(db, "groupChat");

    const unsubscribe = onValue(groupChatRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const allGroupChats = snapshot.val();

      setGroupchats((prevGroupChats) =>
        prevGroupChats.map((gc) => {
          const groupData = allGroupChats[gc.groupChatKey];
          if (!groupData) return gc;

          const lastMessage = groupData.lastMessage || {};
          return {
            ...gc,
            latestMessage: lastMessage.message || "",
            latestSender: lastMessage.displayName || "",
            latestMessageSentAt: lastMessage.sentAt || "",
          };
        })
      );
    });

    return () => unsubscribe();
  }, [groupchats.length, user]);

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
  return (
    <div>
      {groupchats.length > 0 && (
        <>
          {groupchats.map((groupchat) => (
            <div
              key={groupchat.groupChatKey}
              className="flex flex-row w-full border-b border-neutral-900 px-4 py-3 text-sm transition-all duration-100"
              onClick={() =>
                navigate(`/home/groupchat/${groupchat.groupChatKey}`)
              }
            >
              <div className="flex flex-row w-full gap-2">
                <img
                  alt="group-avatar"
                  src={groupchat?.photoUrl || Placeholder}
                  className="w-14 aspect-square rounded-full object-cover"
                />
                <div className="flex flex-col w-full space-y-1">
                  <div className="flex flex-row justify-between">
                    <h1 className="text-sm font-bold text-violet-400">
                      {groupchat?.name}
                    </h1>
                    <span className="text-neutral-600 text-xs">
                      {formatTimestamp(groupchat?.latestMessageSentAt)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    {groupchat?.latestMessage && (
                      <span className="text-xs">
                        {groupchat.latestSender}: {groupchat.latestMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default GroupList;
