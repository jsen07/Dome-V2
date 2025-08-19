import React, { useEffect, useState } from "react";
import Placeholder from "./images/profile-placeholder-2.jpg";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  child,
  serverTimestamp,
} from "firebase/database";
import { useNavigate } from "react-router-dom";
import Fade from "@mui/material/Fade";
import { useAuth } from "./contexts/AuthContext";
import Button from "@mui/material/Button";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ClickAwayListener from "@mui/material/ClickAwayListener";

const LikedBy = ({ postLikes, isLikedBy, handleClickAway }) => {
  const [profileData, setProfileData] = useState([]);
  const [isFriends, setIsFriends] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const fetchUserProfile = async () => {
    try {
      const dbRef = ref(getDatabase());
      const users = [];
      for (const userId of postLikes) {
        const snapshot = await get(child(dbRef, `users/${userId}`));

        if (snapshot.exists()) {
          const user = snapshot.val();

          const friendsSnapshot = await get(
            child(dbRef, `friendsList/${currentUser.uid}/${user.uid}`)
          );
          const isFriend = friendsSnapshot.exists();

          users.push({
            displayName: user.displayName,
            photoUrl: user.photoUrl || "",
            uid: user.uid,
            isFriend,
          });
        }
      }

      setProfileData(users);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleFriendRequest = async (userId) => {
    if (!currentUser) return;

    const friendRequest = {
      uid: currentUser.uid,
      timestamp: serverTimestamp(),
    };
    try {
      const friendRequestRef = ref(getDatabase(), `friendRequests/${userId}`);
      const newFriendRequestRef = push(friendRequestRef);

      await set(newFriendRequestRef, friendRequest);
      setHasSent(true);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Fade in={isLikedBy}>
        <div className="likedby__container">
          <h2> Likes </h2>

          <div className="liked-list">
            {profileData.length > 0 ? (
              profileData.map((user) => (
                <div className="card__container">
                  <div className="chat-details__wrapper">
                    <div className="profile__card">
                      <img
                        alt="user-avatar"
                        src={user?.photoUrl || Placeholder}
                      />
                    </div>

                    <div className="inner-card">
                      <h1
                        onClick={() => navigate(`/profile?userId=${user.uid}`)}
                      >
                        {user?.displayName}
                      </h1>

                      {/* {!user.isFriend && user.uid !== currentUser.uid && (
                        <>
                          {hasSent ? (
                            <p>Friend request has been sent.</p>
                          ) : (
                            // <button onClick={handleFriendRequest}>Send friend request</button>
                            <Button
                              className="send-message-button"
                              variant="outlined"
                              startIcon={<PersonAddIcon />}
                              onClick={() => handleFriendRequest(user.uid)}
                            >
                              Send friend request
                            </Button>
                          )}
                        </>
                      )} */}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p> No liked posts</p>
            )}
          </div>
        </div>
      </Fade>
    </ClickAwayListener>
  );
};

export default LikedBy;
