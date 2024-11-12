import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import Placeholder from './images/profile-placeholder-2.jpg';
import { getDatabase, ref, get, set, push, serverTimestamp, onValue, child, remove } from "firebase/database";
import { useStateValue } from './contexts/StateProvider';

const Posts = () => {

  const { currentUser } = useAuth();
  const [{ user }, dispatch] = useStateValue();
  const [text, setText] = useState();
  const [option, setOption] = useState('Public');
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);

  const handleTextChange = (e) => {
    setText(e.target.value)
  }
  const handleChange = (e) => {
    setOption(e.target.value)
  }
const fetchFriends = async () => {
  if(!currentUser) return
try {
  setIsLoading(true);
    const friendRequestRef = ref(getDatabase());
    const snapshot = await get(child(friendRequestRef, `friendsList/${currentUser.uid}`))

    const data = snapshot.val();
    if(data) {
      const friendsObject = Object.keys(data).reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});
      setFriends(friendsObject)
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

  const Post = {
    displayName: currentUser.displayName,
    photoUrl: currentUser.photoURL,
    uid: currentUser.uid,
    post: text,
    timestamp: Date.now(),
    type: option,
    likes: [],
  }

  if (option === 'Friends') {
    if (Object.keys(friends).length > 0) {
      Post.friendsList = friends;
    }
    else {
      setError('You have no friends!')
    }
}

  try {
      const postRef = ref(getDatabase(), `${option}Posts/${currentUser.uid}`);
      const newPostRef = push(postRef);
      
      await set(newPostRef, Post);
      setText('');
      setPosts(prev=>[...prev, Post])
      console.log('Posted');

  }
  catch (error) {
      console.log(error)
  }

}

const fetchPosts = async () => {
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
     setPosts(flatArray)
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
  fetchPosts();
  },[currentUser]) 

  return (
    <div className='posts__container'>
      <h1>{error || 'Community Posts'}</h1>
      <div className='input-container'>
        <div className='top__header'>
          <img src={currentUser.photoURL || Placeholder } alt='avatar'/>
          <textarea value={text} onChange={handleTextChange} placeholder="What's on your mind baby gorl?" rows="4"></textarea>
        </div>
        <div className='posts__action-buttons'>
        <select
                defaultValue="Public"
                disabled={!currentUser}
                onChange={handleChange}
              >
                <option value="Public">Public</option>
                <option value="Friends">Friends</option>
              </select>
          <button disabled={!currentUser || isLoading} onClick={post}> post </button>
        </div>
      </div>
      {isLoading ? (
        <div className='loading'></div>
      ) : (
        <div className="post__entries">
          {posts.length > 0 ? (
            posts.map((post, index) => {
              return (
                <div key={index} className="post-entry">
                  <div className="post-header">
                    <img src={post.photoUrl || Placeholder} alt={post.displayName} />
                    <h3>{post.displayName}</h3>
                  </div>
                  <p>{post.post || 'No content available.'}</p>
                  <span>{new Date(post.timestamp).toLocaleString()}</span>
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