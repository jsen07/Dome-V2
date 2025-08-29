import React, { useEffect, useState } from "react";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  runTransaction,
  onValue,
  remove,
} from "firebase/database";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Placeholder from "../components/images/profile-placeholder-2.jpg";
import { TransitionGroup } from "react-transition-group";
import Collapse from "@mui/material/Collapse";
import ListItem from "@mui/material/ListItem";
import DeleteIcon from "@mui/icons-material/Delete";

const ProfileComments = ({ user }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getUserProfile = async (id) => {
    const userRef = ref(getDatabase(), `users/${id}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const userData = snap.val();

      return userData;
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchComments = async () => {
      setLoading(true);
      const commentsRef = ref(getDatabase(), `profile/${user.uid}/comments`);
      const snapshot = await get(commentsRef);
      const profileComments = [];

      try {
        if (snapshot.exists()) {
          const commentData = snapshot.val();
          const commentArray = Object.entries(commentData);

          const userProfilePromises = commentArray.map(
            async ([key, comment]) => {
              const userProfile = await getUserProfile(comment.uid);
              console.log(key);

              return {
                id: key,
                displayname: userProfile.displayName,
                photoURL: userProfile.photoUrl || "",
                ...comment,
              };
            }
          );

          const resolvedComments = await Promise.all(userProfilePromises);
          console.log(resolvedComments);
          setComments(resolvedComments);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [user, currentUser]); // Dependencies array

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const postComment = async () => {
    if (!text) return;

    const comment = {
      uid: currentUser.uid,
      comment: text,
      timestamp: Date.now(),
      likes: [],
    };
    try {
      const commentRef = ref(getDatabase(), `profile/${user.uid}/comments`);
      const newCommentRef = push(commentRef);

      await set(newCommentRef, comment);
      setText("");
    } catch (error) {
      console.log(error);
    }
  };

  const toggleLike = async (commentId) => {
    if (!currentUser) return;

    const commentRef = ref(
      getDatabase(),
      `profile/${user.uid}/comments/${commentId}/likes`
    );
    try {
      await runTransaction(commentRef, (likes) => {
        if (!likes) {
          likes = [];
        }
        const userLiked = likes.includes(currentUser.uid);
        if (userLiked) {
          likes = likes.filter((uid) => uid !== currentUser.uid);
        } else {
          likes.push(currentUser.uid);
        }
        return likes;
      });
    } catch (error) {
      console.error(error);
    }
  };

  function formatTimestamp(timestamp) {
    const timestampDate = new Date(timestamp);
    let hours = timestampDate.getHours(); // Get hours
    const minutes = timestampDate.getMinutes();
    let dayOrNight = "";
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() - currentDay + (currentDay === 0 ? -6 : 1)
    );

    if (hours >= 12) {
      dayOrNight = "PM";
    }
    if (hours === 0 || hours < 12) {
      dayOrNight = "AM";
    }
    if (hours === 0) {
      hours = 12;
    }

    const timeOfMessage = `${hours}:${String(minutes).padStart(
      2,
      "0"
    )} ${dayOrNight}`;
    if (timestampDate >= todayStart) {
      return timeOfMessage;
    } else if (timestampDate >= yesterdayStart) {
      return `Yesterday at ${timeOfMessage}`;
    } else if (timestampDate >= startOfWeek) {
      const dayOfWeek = timestampDate.toLocaleString("en-US", {
        weekday: "long",
      });
      return `${dayOfWeek} at ${timeOfMessage}`;
    } else {
      const longDate = timestampDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return `${longDate} at ${timeOfMessage}`;
    }
  }
  // useEffect(() => {
  //  if (!user?.uid) return;

  //     const commentRef = ref(getDatabase(), `profile/${user.uid}/comments`);
  //     const unsubscribe = onValue(commentRef, (snapshot) => {
  //             if (snapshot.exists()) {
  //                 const commentData = snapshot.val();
  //                 const commentsArray = Object.keys(commentData).map(key => ({
  //                     id: key,
  //                     ...commentData[key]
  //                 }));
  //                 setComments(commentsArray);
  //             }
  //         });

  //     return () => unsubscribe();
  // }, [user]);

  const deleteComment = async (commentId) => {
    const commentToDelete = ref(
      getDatabase(),
      `profile/${user.uid}/comments/${commentId}`
    );
    try {
      await remove(commentToDelete).then(() => {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentId)
        );
      });
    } catch (error) {
      console.log(error);
    }
  };
  // onClick={()=> navigate(`/home/profile?userId=${uid}`)}
  const Comment = ({
    uid,
    id,
    displayName,
    photoUrl,
    timestamp,
    comment,
    likes = [],
  }) => {
    return (
      <div className="comment">
        <div className="comment-body">
          <div className="comment-header">
            <span
              className="comment-author"
              onClick={() => navigate(`/profile?userId=${uid}`)}
            >
              {" "}
              {displayName}{" "}
            </span>
            <span className="comment-time"> {formatTimestamp(timestamp)}</span>
          </div>

          <div className="comment__wrapper">
            <div className="comment-profile">
              <img src={photoUrl ? photoUrl : Placeholder} alt="user-profile" />
            </div>
            <div className="comment-text__wrapper">
              <p className="comment-text">{comment}</p>
            </div>
          </div>
          <div className="comment-actions">
            <button className="like-btn" onClick={() => toggleLike(id)}>
              {likes && likes.length > 0 && (
                <span className="like-count"> {likes.length} </span>
              )}
              Like{" "}
            </button>
            {/* <button className="reply-btn">Reply</button> */}
            {currentUser.uid === user.uid && (
              //   <button className="remove-btn" onClick={() => deleteComment(id)}>Remove</button>
              <DeleteIcon
                className="delete"
                onClick={() => deleteComment(id)}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section-title">Comments</h3>

      <div className="comment-input-container">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Write a comment..."
          rows="4"
        ></textarea>
        <div className="post__action">
          <div className="comment-profile">
            <img src={currentUser.photoURL || Placeholder} alt="user-profile" />
          </div>
          <button className="comment-submit-btn" onClick={postComment}>
            Post Comment
          </button>
        </div>
      </div>

      <div className="comment-list">
        <TransitionGroup>
          {comments.map((comment, key) => (
            <Collapse className="collapse" key={key}>
              <ListItem className="list-el">
                <Comment
                  uid={comment.uid}
                  id={comment.id}
                  displayName={comment.displayname}
                  photoUrl={comment.photoURL}
                  timestamp={comment.timestamp}
                  comment={comment.comment}
                  likes={comment.likes}
                />
              </ListItem>
            </Collapse>
          ))}
        </TransitionGroup>
      </div>
    </div>
  );
};

export default ProfileComments;
