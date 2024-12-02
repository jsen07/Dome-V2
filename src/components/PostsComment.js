import React, { useEffect, useState } from 'react'
import { getDatabase, ref, get, set, push } from "firebase/database";
import { useAuth } from './contexts/AuthContext';
import SendIcon from '@mui/icons-material/Send';

const PostsComment = ( { postKey, type, uid }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState();

    const { currentUser } = useAuth();



    function formatTimestamp(timestamp) {
        const date = new Date(timestamp); 
        let options = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true, 
        };

        let timeString = date.toLocaleString('en-US', options);
        timeString = timeString.replace(/^0/, '');
    
        return timeString;
          
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
                <p> {formatTimestamp(comment.timestamp)}</p>
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