import React, { useEffect, useState } from "react";
import FriendsList from "./FriendsList";
import LikedBy from "./LikedBy";
import PostsComment from "./PostsComment";
import Photos from "./ProfileFilters/Photos";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TransgenderIcon from "@mui/icons-material/Transgender";
import { useAuth } from "./contexts/AuthContext";
import PostCard from "./PostCard";
import useFetchUserFeed from "./hooks/useFetchUserFeed";
import {
  getDatabase,
  ref,
  get,
  runTransaction,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";

import { useSelector } from "react-redux";
import { useImagePreloader } from "./hooks/useImagePreloader";
import PostsSkeleton from "./loaders/Skeletons/PostsSkeleton";
const ProfileMainContent = ({
  userDetails,
  handleClick,
  handlePostClick,
  setPostFullscreen,
}) => {
  const { currentUser } = useAuth();
  const activeUser = useSelector((state) => state.user.activeUser);
  const [numberOfFriends, setNumberOfFriends] = useState(null);
  const [showFriends, setShowFriends] = useState(false);
  const [heartAnimations, setHeartAnimations] = useState({});
  const [likedBy, setLikedBy] = useState([]);
  const [isLikedBy, setLikedByComponent] = useState(false);
  const [toggleComment, setToggleComment] = useState({});
  const [likedListLoading, setLikedListLoading] = useState();
  const [activeSection, setActiveSection] = useState("Posts");
  const { posts, setPosts, isLoading, fetchPosts } = useFetchUserFeed(
    currentUser,
    userDetails?.uid
  );
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const imagesLoaded = useImagePreloader(posts);
  useEffect(() => {
    setIsCurrentUser(currentUser.uid === userDetails?.uid ? true : false);
  }, [currentUser, userDetails]);

  const onLike = async (type, uid, postId) => {
    const postRef = ref(getDatabase(), `Posts/${postId}/likes`);
    let didLike = false;

    await runTransaction(postRef, (likes) => {
      if (!likes) likes = [];
      const liked = likes.includes(currentUser.uid);
      if (liked) {
        likes = likes.filter((id) => id !== currentUser.uid);
        didLike = false;
      } else {
        likes.push(currentUser.uid);
        didLike = true;
      }
      return likes;
    });

    const snapshot = await get(ref(getDatabase(), `Posts/${postId}`));
    const updatedPost = snapshot.val();
    if (updatedPost) {
      setPosts((prev) =>
        prev.map((post) =>
          post.postKey === postId ? { ...post, likes: updatedPost.likes } : post
        )
      );
    }

    if (didLike) {
      setHeartAnimations((prev) => ({ ...prev, [postId]: true }));

      setTimeout(() => {
        setHeartAnimations((prev) => ({ ...prev, [postId]: false }));
      }, 1000);
    }
  };

  const onToggleComment = (postKey) => {
    setToggleComment((prev) => ({ ...prev, [postKey]: !prev[postKey] }));
  };

  const isLikedListLoading = (loading) => {
    setLikedListLoading(loading);
  };

  const setFriendsLength = (friends) => {
    setNumberOfFriends(friends);
  };

  const hideFriendsList = () => {
    setShowFriends(false);
  };

  const handleSectionToggle = (section) => {
    setActiveSection(section);
  };

  const formatJoinedDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <>
      <div className="flex flex-col text-white gap-4 grow">
        <div className="flex flex-col px-3 mt-12 gap-2 ">
          <div className="border-b border-neutral-900 pb-2 text-sm flex flex-col">
            <h1 className="font-bold text-xl">
              {isCurrentUser
                ? activeUser?.displayName
                : userDetails?.displayName}
            </h1>
            <span className="text-neutral-500 text-xs">
              {isCurrentUser ? activeUser?.fullName : userDetails?.fullName}
            </span>

            <div className="text-neutral-500 font-medium mt-4 flex flex-col gap-1">
              <span className="flex flex-row items-center gap-1">
                <TransgenderIcon style={{ fontSize: "15px" }} />
                {userDetails?.Gender}
              </span>

              <span className="flex flex-row items-center gap-1">
                <CalendarMonthIcon style={{ fontSize: "15px" }} />
                Joined {formatJoinedDate(userDetails?.joined)}
              </span>

              {numberOfFriends > 0 && (
                <span className="pl-1" onClick={() => setShowFriends(true)}>
                  {numberOfFriends} Friends
                </span>
              )}
            </div>
          </div>

          {userDetails?.Bio && (
            <div className="text-sm pb-2 border-b border-neutral-900">
              <p>{isCurrentUser ? activeUser?.Bio : userDetails?.Bio}</p>
            </div>
          )}

          <FriendsList
            user={userDetails?.uid}
            setFriendsLength={setFriendsLength}
            showFriends={showFriends}
            hideFriendsList={hideFriendsList}
          />
        </div>

        <div className="relative text-white font-medium text-sm flex flex-row py-2">
          <div className="flex flex-row relative mx-3 items-center justify-center w-full">
            <span
              onClick={() => handleSectionToggle("Posts")}
              className="w-1/2 cursor-pointer px-4 py-2 flex flex-row items-center justify-center"
            >
              Posts
            </span>
            <span
              onClick={() => handleSectionToggle("Photos")}
              className="w-1/2 cursor-pointer px-4 py-2 flex flex-row items-center justify-center"
            >
              Photos
            </span>

            <div
              className={`absolute bottom-0 h-[2px] bg-violet-500 transition-all duration-300`}
              style={{
                left: activeSection === "Posts" ? "0%" : "50%",
                width: "50%",
              }}
            />
          </div>
        </div>
        {activeSection === "Posts" && (
          <div className="flex flex-col">
            {posts && imagesLoaded && (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post.postKey}
                    post={post}
                    currentUser={currentUser}
                    onLike={onLike}
                    onToggleComment={onToggleComment}
                    toggleComment={toggleComment}
                    setToggleComment={setToggleComment}
                    heartAnimation={heartAnimations[post.postKey]}
                    likedBySetter={setLikedBy}
                    likedByToggleSetter={setLikedByComponent}
                    isLikedListLoading={isLikedListLoading}
                    displayName={userDetails?.displayName}
                    photoUrl={userDetails?.photoUrl}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {activeSection === "Photos" && <Photos userId={userDetails?.uid} />}
      </div>
      {Object.keys(toggleComment).map(
        (postKey) =>
          toggleComment[postKey] && (
            <PostsComment
              key={postKey}
              postKey={postKey}
              type={posts.find((p) => p.postKey === postKey)?.type}
              uid={posts.find((p) => p.postKey === postKey)?.uid}
              onClose={() =>
                setToggleComment((prev) => ({ ...prev, [postKey]: false }))
              }
            />
          )
      )}

      {isLikedBy && (
        <LikedBy
          postLikes={likedBy}
          isLikedBy={isLikedBy}
          setLikedByComponent={setLikedByComponent}
        />
      )}
    </>
  );
};

export default ProfileMainContent;
