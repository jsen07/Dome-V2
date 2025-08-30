import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PostImageSlider from "./PostImageSlider";
import LikeProfilesList from "./LikeProfilesList";
import Placeholder from "./images/profile-placeholder-2.jpg"; // replace with your placeholder

const PostCard = ({
  post,
  currentUser,
  onLike,
  onToggleComment,
  toggleComment,
  setToggleComment,
  likedBySetter,
  likedByToggleSetter,
  heartAnimation,
  displayName,
  photoUrl,
  likedProfiles,
}) => {
  const userLiked = post.likes?.includes(currentUser.uid) ? true : false;
  const navigate = useNavigate();
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (
      el &&
      (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)
    ) {
      setIsTruncated(true);
    } else {
      setIsTruncated(false);
    }
  }, [post.post]);

  return (
    <div className="flex flex-col w-full shadow-xl gap-2 text-white pt-2 pb-3 border-b border-neutral-900">
      {/* Header */}
      <div className="flex flex-row gap-2 items-center pr-2">
        <img
          src={photoUrl || post.photoUrl || Placeholder}
          alt={post.displayName}
          className="w-10 rounded-full aspect-square object-cover cursor-pointer"
          onClick={() => navigate(`/profile?userId=${post.uid}`)}
        />
        <div className="w-full flex justify-between items-center h-10">
          <div className="flex flex-col justify-center h-10">
            <h2 className="text-sm font-bold">
              {post.displayName ? post.displayName : displayName}
            </h2>
            <h2 className="text-xs font-medium text-neutral-400">
              {post.visibility}
            </h2>
          </div>
          <MoreHorizIcon className="hover:cursor-pointer" />
        </div>
      </div>

      {/* Images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className="flex flex-col border-t border-neutral-900 relative">
          <PostImageSlider
            imageUrls={post.imageUrls}
            post={post}
            likePost={onLike}
          />
          {heartAnimation && (
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none text-8xl z-40">
              <FavoriteOutlinedIcon
                className="text-rose-500 animate-heartPop"
                style={{ fontSize: "inherit" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        className={`flex flex-col ${
          post.imageUrls ? "gap-1" : "flex-col-reverse gap-2 pt-4"
        }`}
      >
        <div className="flex flex-row items-center gap-2 text-sm">
          <div className="flex items-center px-2 gap-1">
            <button onClick={() => onLike(post.type, post.uid, post.postKey)}>
              {userLiked ? (
                <FavoriteOutlinedIcon
                  className="text-rose-500"
                  fontSize="medium"
                />
              ) : (
                <FavoriteBorderOutlinedIcon fontSize="medium" />
              )}
            </button>
            {post.likes?.length > 0 && (
              <span className="font-bold text-xs hover:cursor-pointer">
                {post.likes.length}
              </span>
            )}
          </div>
          <div className="flex items-center px-2 gap-1">
            <button
              className="hover:cursor-pointer"
              onClick={() => onToggleComment(post.postKey)}
            >
              <ChatBubbleOutlineIcon fontSize="medium" />
            </button>
            {post.comments && (
              <span className="font-bold text-xs hover:cursor-pointer">
                {Object.keys(post.comments).length}
              </span>
            )}
          </div>
        </div>

        {post.likes?.length > 0 && (
          <div
            className="w-full flex px-2"
            onClick={() => {
              likedBySetter(post.likes);
              likedByToggleSetter((prev) => !prev);
            }}
          >
            <LikeProfilesList postLikes={likedProfiles} />
          </div>
        )}

        {post.post && (
          <div>
            <div
              className={`px-2 max-w-full overflow-hidden gap-1 ${
                isTruncated || showFullText
                  ? "flex flex-col"
                  : "flex flex-row mb-4"
              } ${showFullText ? "" : "max-h-[65px]"} ${
                !post.imageUrls ? "text-[15px]" : "text-sm"
              }`}
              onDoubleClick={() => onLike(post.type, post.uid, post.postKey)}
              ref={textRef}
            >
              <span className="font-bold">
                {post.imageUrls ? post.displayName : ""}
              </span>
              <p className="whitespace-pre-wrap break-words">{post.post}</p>
            </div>
            <div className="flex flex-col items-start px-2">
              {isTruncated && !showFullText && (
                <span className="text-white w-full"> ... </span>
              )}
              {isTruncated && !showFullText && (
                <button
                  className="text-neutral-500 text-xs mt-1 self-end"
                  onClick={() => setShowFullText(true)}
                >
                  View More
                </button>
              )}
              {showFullText && (
                <button
                  className="text-neutral-500 text-xs mt-1 self-end"
                  onClick={() => setShowFullText(false)}
                >
                  View Less
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <span className="text-xs mt-1 px-2 text-neutral-400 font-semibold">
        {formatTimestamp(post.timestamp)}
      </span>
    </div>
  );
};

function formatTimestamp(timestamp) {
  const now = new Date();
  const diffMs = now - new Date(timestamp);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

export default PostCard;
