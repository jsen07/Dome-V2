import React, { useState } from "react";
import { useStateValue } from "./contexts/StateProvider";

const ChatMessage = ({ data }) => {
  const [{ user }] = useStateValue();
  const [showTimestamp, setShowTimestamp] = useState(false);

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    let dayOrNight = hours >= 12 ? "PM" : "AM";
    if (hours === 0) hours = 12;
    return `${hours}:${String(minutes).padStart(2, "0")} ${dayOrNight}`;
  }

  const isUserMessage = data.uid === user?.uid;

  return (
    <div
      className={`relative text-white text-sm flex flex-col px-3 py-1.5 rounded-lg max-w-xs break-words cursor-pointer my-1 ${
        isUserMessage ? "bg-violet-500" : "bg-neutral-800"
      }`}
      onClick={() => setShowTimestamp((prev) => !prev)}
    >
      {/* Tail at bottom */}
      {/* <div
        className={`absolute w-3 h-3  rotate-45 ${
          isUserMessage
            ? "bottom-0 right-0 translate-x-[6px] translate-y-[-19px] rotate-90 bg-violet-500 rounded-tl-full"
            : "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 bg-neutral-800 rounded-tr-lg"
        }`}
      ></div> */}

      <p className="max-w-[230px]">
        {data.message}

        {showTimestamp && (
          <span
            className={`absolute text-[10px] flex text-gray-200 w-12 ${
              isUserMessage
                ? "bottom-[-20px] right-1 justify-end"
                : "bottom-[-20px] left-1"
            } animate-timestamp-in`}
          >
            {formatTimestamp(data.sentAt)}
          </span>
        )}
      </p>
    </div>
  );
};

export default ChatMessage;
