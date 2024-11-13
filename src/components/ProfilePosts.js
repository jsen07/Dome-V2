import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import Placeholder from './images/profile-placeholder-2.jpg';
import { getDatabase, ref, get, set, push,  child } from "firebase/database";

const ProfilePosts = ( { user }) => {

    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [friendPosts, setFriendPosts] = useState([]);


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
    fetchUserFriendPosts();
},[currentUser, user]) 

  return (
    <div className='user__posts'>
      <h1> Your posts </h1>
        {loading ? (
        <div className='loading'></div>
      ) : (
        <div className="post__entries">
          {friendPosts.length > 0 ? (
            friendPosts.map((post, index) => {
              return (
                <div key={index} className="post-entry">
                  <div className="post-header">
                    <img src={post.photoUrl || Placeholder} alt={post.displayName} />

                    <div className='header__title'>
                      <h3>{post.displayName}</h3>
                      <span>{new Date(post.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className='post__content'>
                  <p>{post.post || 'No content available.'}</p>
                  </div>
                  <div className='post__action-stats'>
                    <p>{post.length || 'Like'}</p>
                    <p> comments </p>
                    </div>
                    <div className='post__action-buttons'>
                      <p> Like </p>
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