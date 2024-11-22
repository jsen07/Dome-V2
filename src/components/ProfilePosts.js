import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import Placeholder from './images/profile-placeholder-2.jpg';
import { getDatabase, ref, get, runTransaction } from "firebase/database";
import LikeIcon from './svg/LikeIcon.svg';

const ProfilePosts = ( { user }) => {

    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [friendPosts, setFriendPosts] = useState([]);
    const [publicPosts, setPublicPosts] = useState([]);
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState();

const fetchPublicPosts = async () => {
  if (!currentUser) return;
  setLoading(true);
  try {
      const postsRef = ref(getDatabase(), `PublicPosts/${user}`);
      const snapshot = await get(postsRef);
      const postsData = snapshot.val();
      
      if (postsData) {
          const postsArray = Object.values(postsData);
          setPublicPosts(postsArray)
      }
      else {
          setPublicPosts([]);
      }
  } catch (error) {
      console.log('Error fetching posts:', error);
  }
  finally {
      setLoading(false);
  }

}
const fetchUserFriendPosts = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
        const postsRef = ref(getDatabase(), `FriendsPosts/${user}`);
        const snapshot = await get(postsRef);
        const postsData = snapshot.val();
        
        if (postsData) {
            const postsArray = Object.values(postsData);
            setFriendPosts(postsArray)
        }
        else {
            setFriendPosts([]);
        }
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
  if (friendPosts.length > 0 || publicPosts.length > 0) {
    const combinedPosts = [...friendPosts, ...publicPosts];
    const sortedPosts = combinedPosts.sort((a, b) => b.timestamp - a.timestamp);

    setPosts(sortedPosts);
  }
  else {
    setPosts([]);
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
  return (
    <div className='user__posts'>
      {/* <h1> Your posts </h1> */}
      {loading ? (
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
                      <h2>{post.displayName}</h2>
                      <span>{new Date(post.timestamp).toLocaleString()}</span>
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
                    <p> comments </p>
                    </div>
                    <div className='post__action-buttons'>
                    {!userLiked ? (
                      <p onClick={() => { likePost(post.type, post.uid, post.postKey); }}>Like</p>
                    ) : (
                    <img src={LikeIcon} onClick={() => { likePost(post.type, post.uid, post.postKey)} }alt="like-button" />
                    )}
                    <p> comment </p>
                      </div>
                 
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

export default ProfilePosts