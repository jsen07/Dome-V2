import React, { useEffect, useState } from "react";
import { getDatabase, ref, get, set, push } from "firebase/database";
import { useAuth } from "./contexts/AuthContext";
import SendIcon from "@mui/icons-material/Send";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

const PostsComment = ({ postKey, type, uid, onClose }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [closing, setClosing] = useState(false);

  const { currentUser } = useAuth();

  const handleClose = () => setClosing(true);

  // Format timestamp for comments
  const formatTimestamp = (timestamp) => {
    const timestampDate = new Date(timestamp);
    let hours = timestampDate.getHours();
    const minutes = timestampDate.getMinutes();
    let dayOrNight = hours >= 12 ? "PM" : "AM";
    if (hours === 0) hours = 12;
    if (hours > 12) hours -= 12;
    const timeOfMessage = `${hours}:${String(minutes).padStart(
      2,
      "0"
    )} ${dayOrNight}`;

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

    if (timestampDate >= todayStart) return `Today at ${timeOfMessage}`;
    if (timestampDate >= yesterdayStart) return `Yesterday at ${timeOfMessage}`;
    if (timestampDate >= startOfWeek && timestampDate < todayStart)
      return `${dayOfWeek} at ${timeOfMessage}`;

    return `${timestampDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} at ${timeOfMessage}`;
  };

  const handleTextChange = (e) => setText(e.target.value);

  const postComment = async () => {
    if (!text.trim()) return;

    const comment = {
      displayName: currentUser.displayName,
      photoUrl: currentUser.photoURL,
      uid: currentUser.uid,
      comment: text,
      timestamp: Date.now(),
      likes: [],
    };

    try {
      const commentRef = ref(
        getDatabase(),
        `${type}Posts/${uid}/${postKey}/comments`
      );
      const notifPostRef = ref(
        getDatabase(),
        `notifications/posts/${uid}/${postKey}/comments/${currentUser.uid}`
      );
      const newCommentRef = push(commentRef);

      await set(newCommentRef, comment);

      if (currentUser.uid !== uid) {
        await set(notifPostRef, {
          uid: currentUser.uid,
          comment: text,
          postId: postKey,
          type,
          timestamp: Date.now(),
        });
      }

      setText("");
      setComments((prev) => [...prev, comment]);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch comments
  useEffect(() => {
    if (!currentUser) return;

    const fetchComments = async () => {
      try {
        const commentsRef = ref(
          getDatabase(),
          `${type}Posts/${uid}/${postKey}/comments`
        );
        const snapshot = await get(commentsRef);

        if (snapshot.exists()) {
          const commentData = snapshot.val();
          const commentsArray = Object.keys(commentData).map((key) => ({
            id: key,
            ...commentData[key],
          }));
          setComments(commentsArray);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchComments();
  }, [postKey, currentUser]);

  useEffect(() => {
    const preventTouch = (e) => e.preventDefault();
    document.addEventListener("touchmove", preventTouch, { passive: false });

    return () => document.removeEventListener("touchmove", preventTouch);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleClose}
      />

      <div
        className={`fixed bottom-0 left-0 w-full z-50 flex items-center flex-col ${
          closing ? "animate-slide-out-bottom" : "animate-slide-in-bottom"
        }`}
        onAnimationEnd={() => closing && onClose()}
      >
        <div className="md:max-w-3xl mx-auto h-[70vh] rounded-t-3xl px-3 py-4 w-full bg-neutral-950 flex flex-col justify-between">
          <div className="text-xl mx-auto my-4 font-bold border-b py-3 mx-3 w-full flex flex-row justify-between">
            <h1>Comments</h1>
            <CloseOutlinedIcon
              onClick={handleClose}
              className="cursor-pointer"
            />
          </div>

          {/* Comments List */}
          <div className="grow flex flex-col gap-2 overflow-y-auto">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex flex-col p-2 gap-2 text-sm border-b border-neutral-800"
                >
                  <div className="flex flex-row justify-between">
                    <h4 className="font-bold text-violet-400">
                      {comment.displayName}
                    </h4>
                    <span className="text-xs text-neutral-400">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>
                  <p>{comment.comment}</p>
                </div>
              ))
            ) : (
              <div className="grow flex flex-col mb-8 items-center justify-center">
                <span className="text-2xl font-bold">No comments yet</span>
                <span className="text-xs text-neutral-400">
                  Be the first to leave a comment
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <textarea
              className="grow h-8 text-black rounded-2xl px-4 py-1 resize-none border border-gray-300 focus:outline-none"
              value={text}
              onChange={handleTextChange}
              placeholder="Write a comment..."
              rows={1}
            />
            <SendIcon
              onClick={postComment}
              className="cursor-pointer mx-2 rotate-[-30deg] text-violet-500 hover:text-violet-700 transition-colors"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PostsComment;
