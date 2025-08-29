import React, { useEffect, useState } from "react";
import { ref, child, get, getDatabase } from "firebase/database";
import { useAuth } from "../contexts/AuthContext";
import Grow from "@mui/material/Grow";

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
      console.error("Error checking friends:", error);
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
      console.error("Error fetching public posts:", error);
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
      console.error("Error fetching friends posts:", error);
    }
  };

  useEffect(() => {
    checkIfFriend();
    getPostsWithPhotosPublic();
    getPostsWithPhotosFriends();
  }, [userId]);

  return (
    <div className="">
      {postsWithImagesPublic.length === 0 &&
        postsWithImagesFriends.length === 0 && (
          <p className="w-full text-center">I'm still working on this 😔</p>
        )}
    </div>
  );
};

export default Photos;
