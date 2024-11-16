import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import Placeholder from './images/profile-placeholder-2.jpg';
import { getDatabase, ref, get, set, push,  child, runTransaction } from "firebase/database";
import { useStateValue } from './contexts/StateProvider';
import LikeIcon from './svg/heart-svgrepo-com.svg';
import LikeButton from './svg/like-svgrepo-com.svg';
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import PostsComment from './PostsComment';
import CommentIcon from './svg/comment-alt-lines-svgrepo-com.svg';
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
      [postKey]: !prevState[postKey], // Toggle the visibility for this specific post
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
try {
  setIsLoading(true);
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
    setIsLoading(false);
    // console.log(friends);
}
catch (error) {
  setIsLoading(false);
    console.log(error)
}       
}

const post = async () => {
  if(!text) return

  const postRef = ref(getDatabase(), `${option}Posts/${currentUser.uid}`);
  const newPostRef = push(postRef);
  const key = newPostRef.key

  const Post = {
    displayName: currentUser.displayName,
    photoUrl: currentUser.photoURL,
    uid: currentUser.uid,
    post: text,
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
      setPosts(prev=>[...prev, Post])
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
    const snapshot = await get(postsRef);
    const postsData = snapshot.val();
    let array = [];

    if (postsData) {
      const postsArray = Object.values(postsData);

     for(let i = 0; i < postsArray.length; i++) {
       array.push(Object.values(postsArray[i]));

     }
     const flatArray = array.flat()

     setPublicPosts([...flatArray]);
    } else {
      setPosts(prev => [...prev]);
    }
  } catch (error) {
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
    const snapshot = await get(postsRef);
    const postsData = snapshot.val();
    let array = [];
    let friendsPosts = []

    if (postsData) {
      const postsArray = Object.values(postsData);

     for(let i = 0; i < postsArray.length; i++) {
       array.push(Object.values(postsArray[i]));

     }
     const flatArray = array.flat()
    //  console.log(flatArray)
     flatArray.forEach(post => {
      const friendsList = Object.values(post.friendsList)

      if(friendsList.includes(currentUser.uid)) {
        friendsPosts.push(post)
      }
     })
     setFriendPosts([...friendsPosts]);
    } else {
      setPosts([]);
    }
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
    if (friendPosts.length > 0 || publicPosts.length > 0) {
      const combinedPosts = [...friendPosts, ...publicPosts];

      const sortedPosts = combinedPosts.sort((a, b) => b.timestamp - a.timestamp);
      setPosts(sortedPosts);
    }
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
      const snapshot = await get(updatedPostRef);
      const updatedPost = snapshot.val();
  
      if (updatedPost) {
        setPosts(prevPosts => {
          return prevPosts.map(post => 
            post.postKey === postId ? { ...post, likes: updatedPost.likes } : post
          );
        });
      }
  }
  catch(error) {
    setError(error)
  }
}
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
}

  return (
    <div className='posts__container'>
      <h1>{error || 'Community Posts'}</h1>
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
          <button disabled={!currentUser || isLoading} onClick={post}> post </button>
        </div>
      </div>

      {isLoading ? (
        <div className='loading'></div>
      ) : (
        <div className="post__entries">
          {posts.length > 0 ? (
            posts.map((post, index) => {
              const userLiked = post.likes && post.likes.includes(currentUser.uid);

              return (
                <div key={index} className="post-entry">
                  <div className="post-header">
                    <img src={post.photoUrl || Placeholder} alt={post.displayName} />

                    <div className='header__title'>
                      <h2 onClick={()=> navigate(`/home/profile?userId=${post.uid}`)}>{post.displayName}</h2>
                      <span>{formatTimestamp(post.timestamp)}</span>
                    </div>
                  </div>
                  <div className='post__content' >
                    <div className='post-text'>
                  <p>{post.post || 'No content available.'}</p>
                  </div>

                  <div className='image-container'>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt='post-image' />
                  )}
                  </div>

                  </div>
                  <div className='post__action-stats'>
                    <div className='likes-wrapper'>
                    <img src={LikeIcon} alt="like-button"/>
                    {post.likes && post.likes.length > 0 && (
                      <span>{post.likes.length}</span>
                    )}
                    </div>
                    <div className='comments-wrapper'>
                    <img src={CommentIcon} alt="comment-icon"/>
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
                  <PostsComment postKey={post.postKey} type={post.type} uid={post.uid} />
                  )}
                </div>
              );
            })
          ) : (
            <p>No posts available.</p>
          )}
        </div>
)}

    </div>
  )
}

export default Posts