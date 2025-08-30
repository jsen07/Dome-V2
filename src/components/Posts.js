import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";
import InfiniteScroll from "react-infinite-scroll-component";
import { useNavigate } from "react-router-dom";
import Placeholder from "./images/profile-placeholder-2.jpg";
import { getDatabase, ref, get, runTransaction } from "firebase/database";

import PostsComment from "./PostsComment";
import LikedBy from "./LikedBy";
import PostCard from "./PostCard";

import useDelayedLoading from "./hooks/delayedLoading";
import PostsSkeleton from "./loaders/Skeletons/PostsSkeleton";
import useFetchFeed from "./hooks/useFetchFeed";
import { useImagePreloader } from "./hooks/useImagePreloader";
import { useLikesPreloader } from "./hooks/useLikesPreloader";

// Posts
const Posts = () => {
  const { currentUser } = useAuth();
  const loadMoreRef = useRef(null);
  const { posts, setPosts, isLoading, fetchPosts } = useFetchFeed(currentUser);
  const { profilesLoaded, profileDataMap } = useLikesPreloader(posts);
  const imagesLoaded = useImagePreloader(posts);
  const [heartAnimations, setHeartAnimations] = useState({});
  const [likedBy, setLikedBy] = useState([]);
  const [isLikedBy, setLikedByComponent] = useState(false);
  const [toggleComment, setToggleComment] = useState({});
  const [likedListLoading, setLikedListLoading] = useState(false);

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

  const allReady = !isLoading && imagesLoaded && profilesLoaded;
  const delayedLoading = useDelayedLoading(!allReady, 300);

  if (delayedLoading) {
    return <PostsSkeleton />;
  }

  if (delayedLoading) {
    return <PostsSkeleton />;
  }
  return (
    <>
      <div id="scrollableDiv">
        <InfiniteScroll
          className="max-w-screen-lg"
          dataLength={posts.length}
          next={fetchPosts}
          hasMore={true}
          pullDownToRefresh
          pullDownToRefreshThreshold={300}
          scrollableTarget="scrollableDiv"
          refreshFunction={() => {
            // only trigger if scroll is at the top
            const scrollTop =
              document.documentElement.scrollTop || document.body.scrollTop;
            if (scrollTop === 0) fetchPosts();
          }}
          pullDownToRefreshContent={
            <div
              className="size-10 w-full flex flex-col items-center justify-center
          "
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                <rect
                  fill="#8B5CF6"
                  stroke="#8B5CF6"
                  strokeWidth="15"
                  width="30"
                  height="30"
                  x="25"
                  y="85"
                >
                  <animate
                    attributeName="opacity"
                    calcMode="spline"
                    dur="2.9"
                    values="1;0;1;"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    repeatCount="indefinite"
                    begin="-.4"
                  ></animate>
                </rect>
                <rect
                  fill="#8B5CF6"
                  stroke="#8B5CF6"
                  strokeWidth="15"
                  width="30"
                  height="30"
                  x="85"
                  y="85"
                >
                  <animate
                    attributeName="opacity"
                    calcMode="spline"
                    dur="2.9"
                    values="1;0;1;"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    repeatCount="indefinite"
                    begin="-.2"
                  ></animate>
                </rect>
                <rect
                  fill="#8B5CF6"
                  stroke="#8B5CF6"
                  strokeWidth="15"
                  width="30"
                  height="30"
                  x="145"
                  y="85"
                >
                  <animate
                    attributeName="opacity"
                    calcMode="spline"
                    dur="2.9"
                    values="1;0;1;"
                    keySplines=".5 0 .5 1;.5 0 .5 1"
                    repeatCount="indefinite"
                    begin="0"
                  ></animate>
                </rect>
              </svg>
            </div>
          }
          // releaseToRefreshContent={
          //   <h3 className="text-white text-center">⟳ Release to refresh</h3>
          // }
        >
          <div className="flex flex-col gap-4">
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
                likedProfiles={profileDataMap[post.postKey] || []}
              />
            ))}
          </div>
        </InfiniteScroll>
      </div>

      {Object.entries(toggleComment).map(([postKey, isOpen]) => {
        if (!isOpen) return null;

        const post = posts.find((p) => p.postKey === postKey);
        if (!post) return null; // safety check
        console.log(post);

        return (
          <PostsComment
            key={postKey}
            postKey={postKey}
            caption={post?.post}
            image={post?.imageUrls?.[0]}
            uid={post.uid}
            onClose={() =>
              setToggleComment((prev) => ({ ...prev, [postKey]: false }))
            }
          />
        );
      })}

      {isLikedBy && (
        <LikedBy
          postLikes={likedBy}
          isLikedBy={isLikedBy}
          setLikedByComponent={setLikedByComponent}
        />
      )}
      {/* <div
        className="h-10 text-neutral-600 w-full flex items-center justify-center"
        ref={loadMoreRef}
      >
        <button> Load more </button>
      </div> */}
    </>
  );
};

export default Posts;
