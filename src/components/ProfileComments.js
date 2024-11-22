import React, { useEffect, useState } from 'react'
import { getDatabase, ref, get, set, push, serverTimestamp, runTransaction, onValue, remove } from "firebase/database";
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Placeholder from '../components/images/profile-placeholder-2.jpg';
import Trash from './svg/bin-svgrepo-com.svg';

const ProfileComments = ({ user }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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
        photoUrl: currentUser.photoURL,
        uid: currentUser.uid,
        comment: text,
        timestamp: Date.now(),
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

    if(hours >= 12) {
        dayOrNight = "PM"
    }
    if(hours === 0 || hours < 12) {
        dayOrNight ="AM"
    }
    if(hours === 0 ) {
        hours = 12;
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

const deleteComment = async (commentId) => {
    const commentToDelete = ref(getDatabase(), `profile/${user.uid}/comments/${commentId}`);
try {
    await remove(commentToDelete).then(()=> {
        setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    })
}
catch (error) {
    console.log(error);
}
}
// onClick={()=> navigate(`/home/profile?userId=${uid}`)}
const Comment = ( {uid, id, displayName, photoUrl, timestamp, comment, likes=[]} ) => {
    return (
    <div className="comment">
    <div className="comment-body">

    <div className="comment-header">
    
    <span className="comment-author" onClick={()=> navigate(`/profile?userId=${uid}`)}> {displayName} </span> 
    <span className="comment-time"> {formatTimestamp(timestamp)}</span>
</div>
    
        <div className='comment__wrapper'>

        <div className='comment-profile'>
            <img src={photoUrl ? photoUrl : Placeholder} alt="user-profile" />
        </div>
        <div className='comment-text__wrapper'>
        <p className="comment-text">{comment}</p>
        </div>
    </div>
    <div className="comment-actions">
            <button className="like-btn" onClick={() => toggleLike(id)}>
     {likes && likes.length > 0 &&(<span className="like-count"> {likes.length} </span>)}
            Like </button>
            {/* <button className="reply-btn">Reply</button> */}
            {currentUser.uid === user.uid && (
    //   <button className="remove-btn" onClick={() => deleteComment(id)}>Remove</button>
      <img src={Trash}  onClick={() => deleteComment(id)} alt="Delete" />
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
<div className='post__action'>
        <div className='comment-profile'>
            <img src={currentUser.photoURL? currentUser.photoURL : Placeholder} alt="user-profile" />
        </div>
        <button className="comment-submit-btn" onClick={postComment}>Post Comment</button>
    </div>
    </div>

    <div className="comment-list">
    {comments.length > 0 && (
    comments.map((comment) => (
      <Comment
        key={comment.id}
        uid={comment.uid}
        id={comment.id}
        displayName={comment.displayName}
        photoUrl={comment.photoUrl}
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

export default ProfileComments