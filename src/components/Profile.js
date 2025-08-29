import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { ref, set, child, get, getDatabase, onValue } from "firebase/database";
import {
  ref as sRef,
  getDownloadURL,
  getStorage,
  uploadBytes,
} from "firebase/storage";
import { db } from "../firebase";

import { useStateValue } from "./contexts/StateProvider";
import { useUserStatus } from "./hooks/useUserStatus";
import { useUserProfile } from "./hooks/useUserProfile";

import { useLocation } from "react-router-dom";
import ProfileComments from "./ProfileComments";
import ProfileMainContent from "./ProfileMainContent";

import ProfileBanner from "./ProfileBanner";
import Photos from "./ProfileFilters/Photos";
import EditProfile from "./EditProfile";
import FullscreenPost from "./FullscreenPost";

const Profile = () => {
  const [isComponentActive, setIsComponentActive] = useState(false);
  const [activeLink, setActiveLink] = useState("Posts");
  // const [userDetails, setUserDetails] = useState(null);
  const [editProfileToggled, setEditProfileToggled] = useState(false);
  const [changeAvatarToggled, setChangeAvatarToggled] = useState(false);
  const [photosToggle, setPhotosToggle] = useState(false);
  const [background, setBackground] = useState();
  const [activeSection, setActiveSection] = useState("Posts");
  const [toggleFullscreen, setToggleFullscreen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [selectedPost, setSelectedPost] = useState();
  const [postFs, setPostFs] = useState();

  const [loading, setLoading] = useState(false);

  // const [status, setStatus] = useState("Offline");
  const [isCurrentUser, setCurrentUser] = useState();

  const { currentUser } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const userId = queryParams.get("userId");
  const status = useUserStatus(userId);
  const { userDetails, error } = useUserProfile(userId);

  useEffect(() => {
    if (editProfileToggled && !isCurrentUser) {
      setEditProfileToggled(false);
    }
  }, [isCurrentUser]);

  function fetchUserBackground(userId) {
    return new Promise((resolve, reject) => {
      setLoading(true);
      const db_ref = db.ref();
      get(child(db_ref, `users/${userId}/background`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setBackground(userData.profileBackground);
            resolve(userData);
            setLoading(false);
          } else {
            setBackground("");
            setLoading(false);
          }
        })
        .catch((error) => {
          console.log("Error fetching user background:", error);

          reject(error);
          setLoading(false);
        });
    });
  }

  useEffect(() => {
    userId === currentUser?.uid ? setCurrentUser(true) : setCurrentUser(false);
    fetchUserBackground(userId);
  }, [userId, currentUser?.uid]);

  // useEffect(() => {
  //   setIsComponentActive(true);
  //   const backgroundRef = ref(getDatabase(), `users/${userId}/background`);
  //   onValue(backgroundRef, (snapshot) => {
  //     if (snapshot.exists()) {
  //       const background = snapshot.val();
  //       setBackground(background.profileBackground);
  //     } else {
  //       setBackground("");
  //     }
  //   });
  // }, [userId]);

  const closebutton = () => {
    setEditProfileToggled(false);
    setChangeAvatarToggled(false);
  };
  const toggleProfileEdit = () => {
    setEditProfileToggled(true);
  };

  const handleClick = (e) => {
    if (clickTimeout) return;

    const timeoutId = setTimeout(() => {
      setToggleFullscreen((prev) => !prev);
      setClickTimeout(null);
    }, 200);

    setClickTimeout(timeoutId);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };
  const setPostFullscreen = (post) => {
    setPostFs(post);
  };

  if (!userDetails) return null;
  return (
    <>
      <div className="w-full flex-col flex grow">
        {/* Profile View */}
        {!editProfileToggled && !loading && (
          <>
            <ProfileBanner
              background={background}
              status={status}
              isCurrentUser={isCurrentUser}
              userDetails={userDetails}
              toggleProfileEdit={toggleProfileEdit}
            />
            {/* <div className="text-white flex flex-row w-full justify-evenly border">
              <p
                onClick={() => {
                  handleSectionToggle("Posts");
                }}
                className={`links ${activeSection === "Posts" ? "active" : ""}`}
              >
                Profile
              </p>
              <p
                onClick={() => {
                  handleSectionToggle("About");
                }}
                className={`links ${activeSection === "About" ? "active" : ""}`}
              >
                About
              </p>
              <p
                onClick={() => {
                  handleSectionToggle("Friends");
                }}
                className={`links ${
                  activeSection === "Friends" ? "active" : ""
                }`}
              >
                Friends
              </p>
              <p
                onClick={() => handleSectionToggle("Photos")}
                className={`links ${
                  activeSection === "Photos" ? "active" : ""
                }`}
              >
                Photos
              </p>
            </div> */}
            {activeSection === "Posts" && (
              <ProfileMainContent
                userDetails={userDetails}
                handleClick={handleClick}
                handlePostClick={handlePostClick}
                setPostFullscreen={setPostFullscreen}
              />
            )}
            {activeSection === "Photos" && <Photos userId={userId} />}
          </>
        )}

        {editProfileToggled && isCurrentUser && (
          <EditProfile
            userDetails={userDetails}
            isCurrentUser={isCurrentUser}
            closebutton={closebutton}
          />
        )}

        {/* {toggleFullscreen &&
          selectedPost &&
          selectedPost.postKey === postFs && (
            <FullscreenPost handleClick={handleClick} post={selectedPost} />
          )} */}
      </div>

      {/* <div className="profile-panel__container">
        <ProfileComments user={userDetails} />
      </div> */}
    </>
  );
};

export default Profile;
