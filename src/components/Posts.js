import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Placeholder from './images/profile-placeholder-2.jpg';
import { getDatabase, ref, get, set, remove, push,  child, runTransaction, onValue } from "firebase/database";
import { useStateValue } from './contexts/StateProvider';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import ModeCommentIcon from '@mui/icons-material/ModeComment';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import PostsComment from './PostsComment';
import FullscreenPost from './FullscreenPost';
import Skeleton from '@mui/material/Skeleton'; 
import DeleteIcon from '@mui/icons-material/Delete';
import LikedBy from './LikedBy';

const Posts = () => {

  const { currentUser } = useAuth();
  const [{ user }, dispatch] = useStateValue();
  const [text, setText] = useState();
  const [option, setOption] = useState('Public');
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
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
  const storage = getStorage();
  const navigate = useNavigate();

  const handleTextChange = (e) => {
    setText(e.target.value); 
  }
  const handleChange = (e) => {
    setOption(e.target.value)
  }
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setImagePreview(previewUrl);
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleCommentToggle = (postKey) => {
    setToggleComment((prevState) => ({
      ...prevState,
      [postKey]: !prevState[postKey], 
    }));
  };

  const handleFileUpload = async (photo) => {
    setIsLoading(true);
    const fileRef = sRef(storage, `${photo.name}`);

    try {
      await uploadBytes(fileRef, photo);
      const photoURL = await getDownloadURL(fileRef);
      setImageUrl(photoURL);
      setIsLoading(false);

    } catch (error) {
      console.error("Error uploading file:", error);
      setIsLoading(false);
    }
  };
const fetchFriends = async () => {
  if(!currentUser) return
  setIsLoading(true);
try {
    const friendRequestRef = ref(getDatabase());
    const snapshot = await get(child(friendRequestRef, `friendsList/${currentUser.uid}`))
    let friendslist = [];
    const data = snapshot.val();
    if(data) {
      const friends = Object.values(data);
      for (let i = 0; i < friends.length; i++) {
        const id = friends[i].uid
        friendslist.push(id)
      }
      friendslist.push(currentUser.uid);
      setFriends(friendslist);
    } 
    else {
      setFriends([]);
    }

}
catch (error) {

    console.log(error)
}
finally {
  setIsLoading(false);

}       
}

const post = async () => {
  if (!text && !imageUrl) {
    return;
  }

  const postRef = ref(getDatabase(), `${option}Posts/${user.uid}`);
  const newPostRef = push(postRef);
  const key = newPostRef.key

  const Post = {
    // displayName: user.displayName,
    // photoUrl: user.photoURL,
    uid: user.uid,
    post: text || "",
    timestamp: Date.now(),
    type: option,
    postKey: key,
    likes: [],
  }

  if (option === 'Friends') {
    if (Object.keys(friends).length > 0) {
      Post.friendsList = friends;
    }
    else {
      setError('You have no friends you fking loner');
      return;
    }
}
if(imageUrl) {
  Post.imageUrl = imageUrl;
}

  try {
      
      await set(newPostRef, Post);
      setText('');
      console.log(publicPosts)
      // setPosts(prev=>[...prev, ...Post])
      setImagePreview(null); 
      setImageUrl(null);
      console.log('Posted');
    }
    catch (error) {
      console.log(error)
    }
  }
 
const fetchPublicPosts = async () => {
  if (!currentUser) return;
setIsLoading(true);
  try {
    const postsRef = ref(getDatabase(), `PublicPosts`);
    const userRef = ref(getDatabase(), `users`);
    const snap = await get(userRef);

    onValue(postsRef, (snapshot) => {
      let posts = [];
      snapshot.forEach((childSnapshot) => {
   
          const post = childSnapshot.val()

          if (snapshot.exists()) {
                const postsArray = Object.values(post);;
                posts.push(...postsArray)
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
    setIsLoading(false);
  }
};

const fetchPrivatePosts = async () => {
  if (!currentUser) return;
setIsLoading(true);
  try {
    const postsRef = ref(getDatabase(), `FriendsPosts`);
    const userRef = ref(getDatabase(), `users`);
    const snap = await get(userRef);

    onValue(postsRef, (snapshot) => {
      let posts = [];
      snapshot.forEach((childSnapshot) => {
   
          const post = childSnapshot.val()
          
          if (snapshot.exists()) {
            const postsArray = Object.values(post);;
            posts.push(...postsArray)
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
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchFriends();
  fetchPublicPosts()
  fetchPrivatePosts();

  },[currentUser]) 
  useEffect(() => {

    const combinedPosts = [...friendPosts, ...publicPosts];
    if (combinedPosts.length > 0) {
      const sortedPosts = combinedPosts.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(sortedPosts);
    } 
    // else {
    //   setPosts([]);

    // }
  
  }, [friendPosts, publicPosts]);

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
  <div className='posts__component'>
    <div className='posts__container'>
      {/* <h1>{error || 'Community Posts'}</h1> */}
      <div className='input-container'>
        <div className='top__header'>
          <img src={currentUser.photoURL || Placeholder } alt='avatar'/>
          <textarea value={text} onChange={handleTextChange} placeholder="What's on your mind baby gorl?" rows="4"></textarea>
          {/* {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" />
          <p>Image Preview</p>
        </div>
      )} */}

        </div>
        <div className='posts__action-buttons'>
          <div className='action__options'>
            <select
                defaultValue="Public"
                disabled={!currentUser}
                onChange={handleChange}
              >
                <option value="Public">Public</option>
                <option value="Friends">Friends</option>
              </select>
              <input type="file" onChange={handleImageChange}></input>
          </div>
          {/* <button disabled={!currentUser || isLoading} onClick={post}> post </button> */}
          <Button variant="contained" endIcon={<SendIcon />} disabled={!currentUser || isLoading} onClick={post}>
        Send
      </Button>
        </div>
      </div>

      {isLoading ? (
          <>
             <Skeleton variant="text" width="100%" height={100} />
             <Skeleton variant="rectangular" width="100%" height={500} />
             <Skeleton variant="text" width="100%" height={100} />
             <Skeleton variant="rectangular" width="100%" height={500} />
          </>
      ) : 
      (
        <div className="post__entries">

          {posts.length === 0 ? (
         <>
         <Skeleton variant="text" width="100%" height={100} />
         <Skeleton variant="rectangular" width="100%" height={500} />
         </>
                  
          ) : (
            posts.map((post, index) => {
              const userLiked = post.likes && post.likes.includes(currentUser.uid);


              return (
                
                <div key={index} className="post-entry">
                      {toggleFullscreen && selectedPost && selectedPost.postKey === post.postKey && (
                <FullscreenPost
                  handleClick={handleClick}
                  post={selectedPost}
                />
              )}
                  <div className="post-header">
                    <img src={post.photoUrl || Placeholder} alt={post.displayName} />

                    <div className='header__title'>
                      <div className="name-time">
                      <h2 onClick={()=> navigate(`/profile?userId=${post.uid}`)}>{post.displayName}</h2>
                      <span>{formatTimestamp(post.timestamp)}</span>
                      </div>

                      {post.uid === currentUser.uid && (
                        <DeleteIcon className='menu-dropdown' onClick={()=> deletePost(post.type, post.postKey)} />
        
                      )}

                    </div>
                  </div>
                  <div className='post__content' onDoubleClick={handleDoubleClick} >
                    {post.post && (
                        <div className='post-text' onDoubleClick={(e)=>handleDoubleClick(e, post.type, post.uid, post.postKey)}>
                        <p>{post.post}</p>
                        </div>
                    )}


                  {post.imageUrl && (
                  <div className='image-container'>
      
                    <img src={post.imageUrl} alt='post-image' 
                    onDoubleClick={ (e)=> handleDoubleClickImage(e, post.type, post.uid, post.postKey)}
                    onClick={() => {handleClick();
                    handlePostClick(post);}}
                    />
           
                  </div>
                )}

                  </div>
                  <div className='post__action-stats'>
                    <div className='likes-wrapper'>
                    {userLiked ?  (
                      <FavoriteOutlinedIcon className='post-icon-group' style={{color: '#C04657'}}/>
                    ) : (
                      < FavoriteBorderOutlinedIcon className='post-icon-group'/>
                     )}

                    {post.likes && post.likes.length > 0 && (
                      <>
                      <span onClick={()=> {
                        setLikedBy(post.likes);
                        setLikedByComponent(prev=>!prev)}}>{post.likes.length}</span>
                      </>
                    )}
                    </div>
                    <div className='comments-wrapper'>
                    <ModeCommentIcon className='post-icon-group'/>
                    {post.comments && (
                    <span>{Object.keys(post.comments).length}</span>
                  )}
                  </div>
                    </div>

                    <div className='post__action-buttons'>
                    {!userLiked ? (
                      <p onClick={() => { likePost(post.type, post.uid, post.postKey); }}>Like</p>
                    ) : (
                      <p onClick={() => { likePost(post.type, post.uid, post.postKey); }}>Unlike</p>
                    )}
                   <p onClick={() => handleCommentToggle(post.postKey)}> Comment </p>
                      </div>
                 {/* COMMNENTS */}
                 {toggleComment[post.postKey] && (
      
                  <div className="comment-p_container">
                  <PostsComment postKey={post.postKey} type={post.type} uid={post.uid} />
                  </div>

                  )}
                </div>
              );
            })

          )}

          {/* {friendPosts.length === 0 && publicPosts.length === 0 && friendPosts.length === 0 && (
            <p> No posts. </p>
          )} */}
        </div>
)}

{isLikedBy && (
 
  <LikedBy postLikes={likedBy} isLikedBy={isLikedBy} handleClickAway={handleClickAway}/>
)}
    </div>
</div>
  )
}

export default Posts