import React, { useEffect, useState } from 'react';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import LikeIconActive from '../svg/LikeIconActive.svg';
import CommentIcon from '../svg/CommentIcon.svg';
import Grow from '@mui/material/Grow';

const Photos = ({ userId }) => {
  const [postsWithImagesPublic, setPostsWithImagesPublic] = useState([]);
  const [postsWithImagesFriends, setPostsWithImagesFriends] = useState([]);
  const { currentUser } = useAuth();
  const [isFriend, setIsFriend] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    if (userId === currentUser.uid) {
      setIsCurrentUser(true);
    } else {
      setIsCurrentUser(false);
    }
  }, [userId]);


  const checkIfFriend = async () => {
    if (userId === currentUser.uid) return;
    try {
      const friendsRef = ref(getDatabase());
      const snapshot = await get(child(friendsRef, `friendsList/${userId}`));
      if (snapshot.exists()) {
        const friendsList = snapshot.val();
        for (const friend in friendsList) {
          if (friend === currentUser.uid) {
            setIsFriend(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking friends:', error);
    }
  };


  const getPostsWithPhotosPublic = async () => {
    try {
      const photosRef = ref(getDatabase());
      const snapshot = await get(child(photosRef, `PublicPosts/${userId}`));
      const postsWithImages = [];
      if (snapshot.exists()) {
        const posts = snapshot.val();
        for (const postKey in posts) {
          const post = posts[postKey];
          if (post.imageUrl) {
            postsWithImages.push(post);
          }
        }
        setPostsWithImagesPublic(postsWithImages);
      }
    } catch (error) {
      console.error('Error fetching public posts:', error);
    }
  };

  const getPostsWithPhotosFriends = async () => {
    try {
      const photosRef = ref(getDatabase());
      const snapshot = await get(child(photosRef, `FriendsPosts/${userId}`));
      const postsWithImages = [];
      if (snapshot.exists()) {
        const posts = snapshot.val();
        for (const postKey in posts) {
          const post = posts[postKey];
          if (post.imageUrl) {
            postsWithImages.push(post);
          }
        }
        setPostsWithImagesFriends(postsWithImages);
      }
    } catch (error) {
      console.error('Error fetching friends posts:', error);
    }
  };


  useEffect(() => {
    checkIfFriend();
    getPostsWithPhotosPublic();
    getPostsWithPhotosFriends();
  }, [userId]);

  return (
    <div className="profile-photos__container">
      {postsWithImagesPublic.length === 0 && postsWithImagesFriends.length === 0 && (
        <p>Nothing to see here 😔</p>
      )}


      <div className="photos__container">
        {/* Public posts with images */}
        {postsWithImagesPublic.length > 0 &&
          postsWithImagesPublic.map((post, key) => (
            <Grow
              in={true}
              key={key}
              timeout={100 + key * 500} //add delay
            >
              <div className="img_container">
                <img src={post.imageUrl} alt="Post" />
                <div className="like-comment">
                  <div className="icons">
                    <div className="sec">
                      <img src={LikeIconActive} alt="like-icon" />
                      <p>{post?.likes?.length || 0}</p>
                    </div>
                    <div className="sec">
                      <img src={CommentIcon} alt="comment-icon" />
                      <p>{post?.comments?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Grow>
          ))}

        {/* Friend posts with images (if friend or current user) */}
        {(postsWithImagesFriends.length > 0 && isFriend) || isCurrentUser ? (
          postsWithImagesFriends.map((post, key) => (
            <Grow
              in={true}
              key={key}
              timeout={100 + key * 500}
            >
              <div className="img_container">
                <img src={post.imageUrl} alt="Post" />
                <div className="like-comment">
                  <div className="icons">
                    <div className="sec">
                      <img src={LikeIconActive} alt="like-icon" />
                      <p>{post?.likes?.length || 0}</p>
                    </div>
                    <p>Comment</p>
                  </div>
                </div>
              </div>
            </Grow>
          ))
        ) : null}
      </div>
    </div>
  );
};

export default Photos;
