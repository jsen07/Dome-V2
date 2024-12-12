import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Placeholder from './images/profile-placeholder-2.jpg';
import { getDatabase, child, ref, get, runTransaction, remove, set, onValue } from "firebase/database";
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import ModeCommentIcon from '@mui/icons-material/ModeComment';
import PostsComment from './PostsComment';
import FullscreenPost from './FullscreenPost';
import Skeleton from '@mui/material/Skeleton'; 
import DeleteIcon from '@mui/icons-material/Delete';



const ProfilePosts = ( { user }) => {

  const { currentUser } = useAuth();
  const [text, setText] = useState();
  const [option, setOption] = useState('Public');
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState('');
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



  const handleCommentToggle = (postKey) => {
    setToggleComment((prevState) => ({
      ...prevState,
      [postKey]: !prevState[postKey], 
    }));
  };

  const friendsCheck = async () => {
    if (user === currentUser.uid) return

    try {
      const friendsRef = ref(getDatabase());
      const snapshot = await get(child(friendsRef, `friendsList/${user}/${currentUser.uid}`));
      
      if (snapshot.exists()) {
        setIsFriends(true);
        return true

      } else {
        setIsFriends(false);
        return false

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
     
            const post = childSnapshot.val()
  
            if (snapshot.exists()) {
                  posts.push(post)
                }
              })
              setPublicPosts(posts)
              
              snap.forEach((childSnapshot) => {
                const userId = childSnapshot.key;
                const userData = childSnapshot.val()
                
                setPublicPosts((postData) => {
                  return postData.map(post => {
                    if(post.uid === userId) {
                      return { 
                        ...post,
                        displayName: userData.displayName,
                        photoUrl: userData.photoUrl
                      };
                    }
                    return post;
                  })
                })
              })
            })
          }
          catch (error) {
            console.log('Error fetching posts:', error);
          }
    finally {
      setLoading(false);
      console.log(publicPosts)
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
     
            const post = childSnapshot.val()
            
            if (snapshot.exists()) {
              posts.push(post)
            } 
          })
          
          setFriendPosts(posts)
              
              snap.forEach((childSnapshot) => {
                const userId = childSnapshot.key;
                const userData = childSnapshot.val()
                
                setFriendPosts((postData) => {
                  return postData.map(post => {
                    if(post.uid === userId) {
                      return { 
                        ...post,
                        displayName: userData.displayName,
                        photoUrl: userData.photoUrl
                      };
                    }
                    return post;
                  })
                })
              })
            })
    } catch (error) {
      console.log('Error fetching posts:', error);
    }
    finally {
      setLoading(false);
    }
};
useEffect(() => {
  fetchPublicPosts();
  fetchUserFriendPosts();
},[currentUser, user]) 

useEffect(() => {

    const checkFriends = async () => {
      try {
        if (friendPosts.length > 0 || publicPosts.length > 0) {
        const isFriends = await friendsCheck();
        
        if (isFriends) {
          const combinedPosts = [...friendPosts, ...publicPosts]; 
          const sortedPosts = combinedPosts.sort((a, b) => b.timestamp - a.timestamp);

          setPosts(sortedPosts);
        }
        else {
          const combinedPosts = [...publicPosts]
          const sortedPosts = combinedPosts.sort((a, b) => b.timestamp - a.timestamp);

          setPosts(sortedPosts);
        }
      } 
      else {
        setPosts([]);
      }
    }catch (error) {
        console.error("Error in checking friendship:", error);
      }
    
  }
  if(user !== currentUser.uid) {
    checkFriends();
  } 
  else {
    const combinedPosts = [...friendPosts, ...publicPosts];
    const sortedPosts = combinedPosts.sort((a, b) => b.timestamp - a.timestamp);

    setPosts(sortedPosts);
  }
},[friendPosts, publicPosts, user, currentUser])

const likePost = async (type, uid, postId ) => {

  const postRef = ref(getDatabase(), `${type}Posts/${uid}/${postId}/likes`);
  try {
      await runTransaction(postRef, (likes) => {
  
          if (!likes) {
              likes = [];
          }
          const userLiked = likes.includes(currentUser.uid);
          if (userLiked) {
              likes = likes.filter(uid => uid !== currentUser.uid);
          } else {
              likes.push(currentUser.uid);
          }
          return likes;
      });
      const updatedPostRef = ref(getDatabase(), `${type}Posts/${uid}/${postId}`);
      const notifPostRef = ref(getDatabase(), `notifications/posts/${uid}/${postId}/like`);
      const snapshot = await get(updatedPostRef);
      const updatedPost = snapshot.val();
  
      if (updatedPost) {
        setPosts(prevPosts => {
          return prevPosts.map(post => 
            post.postKey === postId ? { ...post, likes: updatedPost.likes } : post
          );
        });

        set(notifPostRef, {
          timestamp: Date.now(),
          postId: postId,
          senderId: currentUser.uid,
      });
      }
  }
  catch(error) {
    setError(error)
  }
}

function formatTimestamp(timestamp) {
  const timestampDate = new Date(timestamp);
  let hours = timestampDate.getHours();       // Get hours
  const minutes = timestampDate.getMinutes()
  let dayOrNight = "";
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  const dayOfWeek = timestampDate.toLocaleString('en-US', { weekday: 'long' });

  if(hours >= 12) {
      dayOrNight = "PM"
  }
  if(hours === 0 || hours < 12) {
      dayOrNight ="AM"
  }
  if( hours === 0 ) {
      hours = 12;
  }

  const timeOfMessage = `${hours}:${String(minutes).padStart(2, '0')} ${dayOrNight}`;
  if (timestampDate >= todayStart) {
      
      
      return `Today at ${timeOfMessage}`;

  } else if (timestampDate >= yesterdayStart) {
      return `Yesterday at ${timeOfMessage}`;
  } else if (timestampDate >= startOfWeek && timestampDate <= todayStart) {
  
      return `${dayOfWeek} at ${timeOfMessage}`
  } else {
      return `${timestampDate.toLocaleDateString("en-US", { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
      })} at ${timeOfMessage}`
      }
}

const handleDoubleClick = (e, type, uid, postKey) => {
  e.preventDefault();
  likePost(type, uid, postKey);
};
const handleDoubleClickImage = (e, type, uid, postKey) => {
  // Clear the click timeout to prevent the single-click handler from firing
  if (clickTimeout) {
    clearTimeout(clickTimeout);
    setClickTimeout(null);
  }
  // Handle double-click logic (e.g., like or expand post)
  handleDoubleClick(e, type, uid, postKey);
};


const handleClick = (e) => {

  if (clickTimeout) return;

  const timeoutId = setTimeout(() => {
    setToggleFullscreen((prev) => !prev);
    setClickTimeout(null); 
  }, 200);

  setClickTimeout(timeoutId);
};

const handlePostClick = (post) => {
  setSelectedPost(post);
};

const deletePost = async (type, postId) => {
  console.log(type, postId)
  const postToDelete = ref(getDatabase(), `${type}Posts/${currentUser.uid}/${postId}`);
try {
  await remove(postToDelete);
}
catch (error) {
  console.log(error);
}
}
const handleClickAway = () => {
  setLikedByComponent(false);

}
  return (
<div className="user__posts">
  {/* <h1>Your posts</h1> */}
  {(loading && posts.length === 0) ? (
    <>
      <Skeleton variant="text" width="100%" height={100} />
      <Skeleton variant="rectangular" width="100%" height={500} />
    </>
  ) : (
    <div className="post__entries">
      {posts.map((post) => {
        const userLiked = post.likes?.includes(currentUser.uid); // Use optional chaining to safely access likes

        return (
          <div key={post.postKey} className="post-entry">
            {toggleFullscreen && selectedPost && selectedPost.postKey === post.postKey && (
              <FullscreenPost handleClick={handleClick} post={selectedPost} />
            )}

            <div className="post-header">
            <img src={post.photoUrl || Placeholder} alt={post.displayName} />
              <div className="header__title">
        
                <div className="name-time">
                  <h2>{post.displayName}</h2>
                  <span>{formatTimestamp(post.timestamp)}</span>
                </div>

                {post.uid === currentUser.uid && (
                  <DeleteIcon
                    className="menu-dropdown"
                    onClick={() => deletePost(post.type, post.postKey)}
                  />
                )}
              </div>
            </div>

            <div className="post__content" onDoubleClick={(e) => handleDoubleClick(e, post.type, post.uid, post.postKey)}>
              {post.post && (
                <div className="post-text" onDoubleClick={(e) => handleDoubleClick(e, post.type, post.uid, post.postKey)}>
                  <p>{post.post}</p>
                </div>
              )}

              {post.imageUrl && (
                <div className="image-container">
                  <img
                    src={post.imageUrl}
                    alt="post-image"
                    onDoubleClick={(e) => handleDoubleClickImage(e, post.type, post.uid, post.postKey)}
                    onClick={() => {
                      handleClick();
                      handlePostClick(post);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="post__action-stats">
              <div className="likes-wrapper">
                {userLiked ? (
                  <FavoriteOutlinedIcon className="post-icon-group" style={{ color: "#C04657" }} />
                ) : (
                  <FavoriteBorderOutlinedIcon className="post-icon-group" />
                )}

                {post.likes?.length > 0 && (
                  <span onClick={() => {
                    setLikedBy(post.likes);
                    setLikedByComponent((prev) => !prev);
                  }}>
                    {post.likes.length}
                  </span>
                )}
              </div>

              <div className="comments-wrapper">
                <ModeCommentIcon className="post-icon-group" />
                {post.comments && <span>{Object.keys(post.comments).length}</span>}
              </div>
            </div>

            <div className="post__action-buttons">
              {!userLiked ? (
                <p onClick={() => likePost(post.type, post.uid, post.postKey)}>Like</p>
              ) : (
                <p onClick={() => likePost(post.type, post.uid, post.postKey)}>Unlike</p>
              )}
              <p onClick={() => handleCommentToggle(post.postKey)}>Comment</p>
            </div>

            {/* Comments Section */}
            {toggleComment[post.postKey] && (
              <div className="comment-p_container">
                <PostsComment postKey={post.postKey} type={post.type} uid={post.uid} />
              </div>
            )}
          </div>
        );
      })}

      {(friendPosts.length === 0 && publicPosts.length === 0 && posts.length === 0) && (
        <p>No posts.</p>
      )}
    </div>
  )}
</div>

  )
}

export default ProfilePosts