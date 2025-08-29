import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Placeholder from "./images/profile-placeholder-2.jpg";
import {
  getDatabase,
  child,
  ref,
  get,
  runTransaction,
  remove,
  set,
  onValue,
} from "firebase/database";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PostsComment from "./PostsComment";
import FullscreenPost from "./FullscreenPost";
import Skeleton from "@mui/material/Skeleton";
import DeleteIcon from "@mui/icons-material/Delete";
import LikedBy from "./LikedBy";

const ProfilePosts = ({
  user,
  handleClick,
  handlePostClick,
  setPostFullscreen,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState();
  const [option, setOption] = useState("Public");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [friendPosts, setFriendPosts] = useState([]);
  const [publicPosts, setPublicPosts] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState();
  const [toggleComment, setToggleComment] = useState({});
  const [toggleFullscreen, setToggleFullscreen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [selectedPost, setSelectedPost] = useState();
  const [isLikedBy, setLikedByComponent] = useState(false);
  const [likedBy, setLikedBy] = useState([]);
  const [isFriends, setIsFriends] = useState(false);
  const [heartAnimations, setHeartAnimations] = useState({});

  const handleCommentToggle = (postKey) => {
    setToggleComment((prevState) => ({
      ...prevState,
      [postKey]: !prevState[postKey],
    }));
  };
  const handleClickAway = () => {
    setLikedByComponent(false);
  };
  const friendsCheck = async () => {
    if (user === currentUser.uid) return;

    try {
      const friendsRef = ref(getDatabase());
      const snapshot = await get(
        child(friendsRef, `friendsList/${user}/${currentUser.uid}`)
      );

      if (snapshot.exists()) {
        setIsFriends(true);
        return true;
      } else {
        setIsFriends(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }
  };
  const fetchPublicPosts = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const postsRef = ref(getDatabase(), `PublicPosts/${user}`);
      const userRef = ref(getDatabase(), `users`);
      const snap = await get(userRef);

      onValue(postsRef, (snapshot) => {
        let posts = [];
        snapshot.forEach((childSnapshot) => {
          const post = childSnapshot.val();

          if (snapshot.exists()) {
            posts.push(post);
          }
        });
        setPublicPosts(posts);

        snap.forEach((childSnapshot) => {
          const userId = childSnapshot.key;
          const userData = childSnapshot.val();

          setPublicPosts((postData) => {
            return postData.map((post) => {
              if (post.uid === userId) {
                return {
                  ...post,
                  displayName: userData.displayName,
                  photoUrl: userData.photoUrl,
                };
              }
              return post;
            });
          });
        });
      });
    } catch (error) {
      console.log("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUserFriendPosts = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const postsRef = ref(getDatabase(), `FriendsPosts/${user}`);
      const userRef = ref(getDatabase(), `users`);
      const snap = await get(userRef);

      onValue(postsRef, (snapshot) => {
        let posts = [];
        snapshot.forEach((childSnapshot) => {
          const post = childSnapshot.val();

          if (snapshot.exists()) {
            posts.push(post);
          }
        });

        setFriendPosts(posts);

        snap.forEach((childSnapshot) => {
          const userId = childSnapshot.key;
          const userData = childSnapshot.val();

          setFriendPosts((postData) => {
            return postData.map((post) => {
              if (post.uid === userId) {
                return {
                  ...post,
                  displayName: userData.displayName,
                  photoUrl: userData.photoUrl,
                };
              }
              return post;
            });
          });
        });
      });
    } catch (error) {
      console.log("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPublicPosts();
    fetchUserFriendPosts();
  }, [currentUser, user]);

  useEffect(() => {
    const checkFriends = async () => {
      try {
        if (friendPosts.length > 0 || publicPosts.length > 0) {
          const isFriends = await friendsCheck();

          if (isFriends) {
            const combinedPosts = [...friendPosts, ...publicPosts];
            const sortedPosts = combinedPosts.sort(
              (a, b) => b.timestamp - a.timestamp
            );

            setPosts(sortedPosts);
          } else {
            const combinedPosts = [...publicPosts];
            const sortedPosts = combinedPosts.sort(
              (a, b) => b.timestamp - a.timestamp
            );

            setPosts(sortedPosts);
          }
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error in checking friendship:", error);
      }
    };
    if (user !== currentUser.uid) {
      checkFriends();
    } else {
      const combinedPosts = [...friendPosts, ...publicPosts];
      const sortedPosts = combinedPosts.sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setPosts(sortedPosts);
    }
  }, [friendPosts, publicPosts, user, currentUser]);

  const likePost = async (type, uid, postId) => {
    const postRef = ref(getDatabase(), `${type}Posts/${uid}/${postId}/likes`);
    try {
      await runTransaction(postRef, (likes) => {
        if (!likes) {
          likes = [];
        }
        const userLiked = likes.includes(currentUser.uid);
        if (userLiked) {
          likes = likes.filter((uid) => uid !== currentUser.uid);
        } else {
          likes.push(currentUser.uid);
        }
        return likes;
      });
      const updatedPostRef = ref(
        getDatabase(),
        `${type}Posts/${uid}/${postId}`
      );
      const notifPostRef = ref(
        getDatabase(),
        `notifications/posts/${uid}/${postId}/like`
      );
      const snapshot = await get(updatedPostRef);
      const updatedPost = snapshot.val();

      if (updatedPost) {
        setPosts((prevPosts) => {
          return prevPosts.map((post) =>
            post.postKey === postId
              ? { ...post, likes: updatedPost.likes }
              : post
          );
        });

        set(notifPostRef, {
          timestamp: Date.now(),
          postId: postId,
          senderId: currentUser.uid,
        });
      }
    } catch (error) {
      setError(error);
    }
  };

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
      return `${timestampDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })} at ${timeOfMessage}`;
    }
  }

  const handleDoubleClick = (e, type, uid, postKey) => {
    e.preventDefault();
    likePost(type, uid, postKey);
  };
  const handleDoubleClickImage = (e, type, uid, postKey) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    handleDoubleClick(e, type, uid, postKey);
  };

  // const handleClick = (e) => {

  //   if (clickTimeout) return;

  //   const timeoutId = setTimeout(() => {
  //     setToggleFullscreen((prev) => !prev);
  //     setClickTimeout(null);
  //   }, 200);

  //   setClickTimeout(timeoutId);
  // };

  // const handlePostClick = (post) => {
  //   setSelectedPost(post);
  // };

  const deletePost = async (type, postId) => {
    console.log(type, postId);
    const postToDelete = ref(
      getDatabase(),
      `${type}Posts/${currentUser.uid}/${postId}`
    );
    try {
      await remove(postToDelete);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-10 grow">
        {posts.length > 0 &&
          posts.map((post, index) => {
            const userLiked =
              post.likes && post.likes.includes(currentUser.uid);

            return (
              <div
                key={index}
                className="flex flex-col gap-2 text-white pt-2 pb-6 border-b border-neutral-900"
              >
                {/* <div className="hidden lg:flex">
                        {toggleFullscreen &&
                          selectedPost &&
                          selectedPost.postKey === post.postKey && (
                            <FullscreenPost
                              handleClick={handleClick}
                              post={selectedPost}
                            />
                          )}
                      </div> */}
                <div className="flex flex-row gap-2 px-2 items-center">
                  <img
                    src={post.photoUrl || Placeholder}
                    alt={post.displayName}
                    className="w-10 rounded-full aspect-square object-cover"
                    onClick={() => navigate(`/profile?userId=${post.uid}`)}
                  />

                  <div className=" w-full flex flex-row justify-between">
                    <div className="grow flex flex-col">
                      <h2 className="text-sm font-bold">{post.displayName}</h2>
                      <span className="text-xxs text-neutral-400">
                        {formatTimestamp(post.timestamp)}
                      </span>
                    </div>

                    {/* {post.uid === currentUser.uid && (
                          <DeleteIcon
                            className=""
                            onClick={() => deletePost(post.type, post.postKey)}
                          />
                        )} */}
                  </div>
                </div>
                <div
                  className="flex flex-col gap-2"
                  onDoubleClick={handleDoubleClick}
                >
                  {post.imageUrl && (
                    <div className="flex items-center border-t border-neutral-900 min-h-[300px] relative">
                      <img
                        src={post.imageUrl}
                        alt="post-image"
                        loading="lazy"
                        decoding="async"
                        className="w-full max-h-[600px] object-contain md:rounded-sm"
                        onDoubleClick={(e) =>
                          handleDoubleClickImage(
                            e,
                            post.type,
                            post.uid,
                            post.postKey
                          )
                        }
                        onClick={() => {
                          handleClick();
                          handlePostClick(post);
                        }}
                      />
                      {/* Heart bounceOut animation */}
                      {heartAnimations[post.postKey] && (
                        <div className="absolute inset-0 flex justify-center items-center text-9xl z-40">
                          <FavoriteOutlinedIcon
                            className="text-rose-500 animate-heartPop"
                            style={{ fontSize: "inherit" }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    post.imageUrl ? "gap-4" : "flex-col-reverse gap-6"
                  }`}
                >
                  <div className=" flex flex-row gap-2 items-center text-sm">
                    <div className=" flex px-2 gap-1 items-center">
                      <button
                        disabled={heartAnimations[post.postKey]}
                        onClick={() => {
                          likePost(post.type, post.uid, post.postKey);
                        }}
                      >
                        {userLiked ? (
                          <FavoriteOutlinedIcon className="text-rose-500" />
                        ) : (
                          <FavoriteBorderOutlinedIcon />
                        )}
                      </button>

                      {post.likes && post.likes.length > 0 && (
                        <span
                          className="font-bold text-xs hover:cursor-pointer"
                          onClick={() => {
                            setLikedBy(post.likes);
                            setLikedByComponent((prev) => !prev);
                          }}
                        >
                          {post.likes.length}
                        </span>
                      )}
                    </div>

                    <button
                      className="flex px-2 gap-1 items-center hover:cursor-pointer"
                      onClick={() => handleCommentToggle(post.postKey)}
                    >
                      <ChatBubbleOutlineIcon />
                      {/* <MapsUgcOutlinedIcon className="" /> */}
                      {post.comments && (
                        <span>{Object.keys(post.comments).length}</span>
                      )}
                    </button>

                    <p
                      onClick={() => handleCommentToggle(post.postKey)}
                      className=" ml-auto text-neutral-500 px-2 hover:cursor-pointer"
                    >
                      {" "}
                      Comment{" "}
                    </p>
                  </div>
                  {post.post && (
                    <h2
                      className="px-2 text-sm"
                      onDoubleClick={(e) =>
                        handleDoubleClick(e, post.type, post.uid, post.postKey)
                      }
                    >
                      <span className="font-bold">
                        {post.imageUrl ? post.displayName : ""}
                      </span>{" "}
                      {post.post}
                    </h2>
                  )}
                </div>
                {/* COMMNENTS */}

                {toggleComment[post.postKey] && (
                  <PostsComment
                    postKey={post.postKey}
                    type={post.type}
                    uid={post.uid}
                    open={toggleComment[post.postKey]}
                    onClose={() =>
                      setToggleComment((prev) => ({
                        ...prev,
                        [post.postKey]: false,
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
      </div>
      {/* {!posts && <p> No posts. </p>} */}
      {isLikedBy && (
        <LikedBy
          postLikes={likedBy}
          isLikedBy={isLikedBy}
          handleClickAway={handleClickAway}
        />
      )}
      {/* </div> */}
    </>
  );
};

export default ProfilePosts;
