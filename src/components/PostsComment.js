import React, { useEffect, useState } from 'react'
import { getDatabase, ref, get, set, push } from "firebase/database";
import { useAuth } from './contexts/AuthContext';
import SendIcon from '@mui/icons-material/Send';

const PostsComment = ( { postKey, type, uid }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState();

    const { currentUser } = useAuth();



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

const handleTextChange = (e) => {
    console.log(e.target.value)
    setText(e.target.value);
};

const postComment = async () => {

    if(!text) return

    const comment = {
        displayName: currentUser.displayName,
        photoUrl: currentUser.photoURL,
        uid: currentUser.uid,
        comment: text,
        timestamp: Date.now(),
        likes: []
    }
    try {
        const commentRef = ref(getDatabase(), `${type}Posts/${uid}/${postKey}/comments`);
        const notifPostRef = ref(getDatabase(), `notifications/posts/${uid}/${postKey}/comments/${currentUser.uid}`);
        const newCommentRef = push(commentRef);
        
        await set(newCommentRef, comment);

        if(currentUser.uid !== uid) {    
        await set(notifPostRef, {
          uid: currentUser.uid,
          comment: text,
          postId: postKey,
          type: type,
          timestamp: Date.now(),
        });
        }
        setText('');
        setComments(prev=>[...prev, comment]);

    }
    catch (error) {
        console.log(error)
    }
}
useEffect(() => {
    if(!currentUser) return
    
        const fetchComments = async () => {
          try {
            const commentsRef = ref(getDatabase(), `${type}Posts/${uid}/${postKey}/comments`);
            const snapshot = await get(commentsRef);
    
            if (snapshot.exists()) {
              const commentData = snapshot.val();
              const commentsArray = Object.keys(commentData).map(key => ({
                id: key,
                ...commentData[key]
              }));
              setComments(commentsArray);
            // console.log(commentsArray);
            } else {
              setComments([]); 
            }
          } catch (error) {
            console.log(error)
          }    
        }

        fetchComments();
}, [postKey]);
return (
    <div className='post-comment__container'>
         <div className='post__comment'>
        {comments.length > 0 && (
    comments.map((comment) => (
        <div className='comment__container'>
            <div className='post-comment__header'>
                <h4> {comment.displayName}</h4>
                <span> {formatTimestamp(comment.timestamp)}</span>
            </div>
                <p> {comment.comment}</p>
                </div>  
           
            ))
        )}
        </div>
            
            <div className='comment__input'>
            <textarea value={text} onChange={handleTextChange} placeholder="Write a comment..." rows="1"></textarea>
                <SendIcon onClick={postComment} />
                </div>
                </div>
  )
}

export default PostsComment