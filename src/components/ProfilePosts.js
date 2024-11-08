import React, { useEffect, useState } from 'react'
import { getDatabase, ref, get, set, push, serverTimestamp, runTransaction, onValue } from "firebase/database";
import { useAuth } from './contexts/AuthContext';


const ProfilePosts = ({ user }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState();
    const { currentUser } = useAuth();

    useEffect(() => {
    if(!user?.uid) return
    
        const fetchComments = async () => {
          try {
            const commentsRef = ref(getDatabase(), `profile/${user.uid}/comments`);
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
}, [user]);

const handleTextChange = (e) => {
    setText(e.target.value);
};

const postComment = async () => {

    if(!text) return

    const comment = {
        displayName: currentUser.displayName,
        uid: currentUser.uid,
        comment: text,
        timestamp: serverTimestamp(),
        likes: []
    }
    try {
        const commentRef = ref(getDatabase(), `profile/${user.uid}/comments`);
        const newCommentRef = push(commentRef);
        
        await set(newCommentRef, comment);
        setText('');

    }
    catch (error) {
        console.log(error)
    }
}

const toggleLike = async (commentId) => {
    if (!currentUser) return;

    const commentRef = ref(getDatabase(), `profile/${user.uid}/comments/${commentId}/likes`);
try {
    await runTransaction(commentRef, (likes) => {

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
}
catch (error) {
    console.error(error)
}
};


  function formatTimestamp(timestamp) {
    const timestampDate = new Date(timestamp);
    const hours = timestampDate.getHours();       // Get hours
    const minutes = timestampDate.getMinutes()
    let dayOrNight = "";
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    if(hours >= 12) {
        dayOrNight = "PM"
    }
    if(hours === 0 || hours < 12) {
        dayOrNight ="AM"
    }

    const timeOfMessage = `${hours}:${String(minutes).padStart(2, '0')} ${dayOrNight}`;
    if (timestampDate >= todayStart) {
        
        return timeOfMessage;

    } else if (timestampDate >= yesterdayStart) {
        return "Yesterday";
    } else if (timestampDate >= startOfWeek) {
        const dayOfWeek = timestampDate.toLocaleString('en-US', { weekday: 'long' });
        return dayOfWeek;
    } else {
        return timestampDate.toLocaleDateString("en-US", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        }
    }
useEffect(() => {
 if (!user?.uid) return;

    const commentRef = ref(getDatabase(), `profile/${user.uid}/comments`);
    const unsubscribe = onValue(commentRef, (snapshot) => {
            if (snapshot.exists()) {
                const commentData = snapshot.val();
                const commentsArray = Object.keys(commentData).map(key => ({
                    id: key,
                    ...commentData[key]
                }));
                setComments(commentsArray);
            }
        });

    return () => unsubscribe();
}, [user]);
const Comment = ( {id, displayName, timestamp, comment, likes=[]} ) => {
    return (
    <div className="comment">
    <div className="comment-body">
        <div className="comment-header">
            <span className="comment-author"> {displayName}</span> 
            <span className="comment-time"> {formatTimestamp(timestamp)}</span>
        </div>
        <p className="comment-text">{comment}</p>
        <div className="comment-actions">
            <button className="like-btn" onClick={() => toggleLike(id)}>
     {likes && likes.length > 0 &&(<span className="like-count"> {likes.length} </span>)}
            Like </button>
            <button className="reply-btn">Reply</button>
            {currentUser.uid === user.uid && (
      <button className="remove-btn">Remove</button>
            )}
        </div>
    </div>
</div>
 )}

  return (
    <div className="comment-section">
    <h3 className="comment-section-title">Comments</h3>

    <div className="comment-input-container">
        <textarea value={text} onChange={handleTextChange} placeholder="Write a comment..." rows="4"></textarea>
        <button className="comment-submit-btn" onClick={postComment}>Post Comment</button>
    </div>

    <div className="comment-list">
    {comments.length > 0 && (
    comments.map((comment) => (
      <Comment
        key={comment.id}
        id={comment.id}
        displayName={comment.user}
        timestamp={comment.timestamp}
        comment={comment.comment}
        likes={comment.likes}
      />
    ))
    )}
    
  

    </div>
</div>

  )
}

export default ProfilePosts