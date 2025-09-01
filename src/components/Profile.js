import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import Placeholder from "./images/profile-placeholder-2.jpg";
import BgPlaceholder from "./images/logo-transparent-cropped-png.png";

import { useUserProfile } from "./hooks/useUserProfile";
import { useFetchUserFriends } from "./hooks/useFetchUserFriends";
import { useProfilePreloader } from "./hooks/useProfilePreloader";

import { useSelector } from "react-redux";

import { useLocation } from "react-router-dom";
import ProfileComments from "./ProfileComments";
import ProfileMainContent from "./ProfileMainContent";

import ProfileBanner from "./ProfileBanner";
import Photos from "./ProfileFilters/Photos";
import EditProfile from "./EditProfile";
import FullscreenPost from "./FullscreenPost";

const Profile = () => {
  const [editProfileToggled, setEditProfileToggled] = useState(false);
  const [background, setBackground] = useState();
  const [activeSection, setActiveSection] = useState("Posts");
  const [toggleFullscreen, setToggleFullscreen] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [selectedPost, setSelectedPost] = useState();
  const [postFs, setPostFs] = useState();
  const [isCurrentUser, setCurrentUser] = useState();

  const { currentUser } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const userId = queryParams.get("userId");
  const activeUser = useSelector((state) => state.user.activeUser);

  const { userDetails, UserProfileLoading } = useUserProfile(userId);
  const { friends, loadingFriends } = useFetchUserFriends(userId);

  const profileImageSrc =
    (isCurrentUser ? activeUser?.photoUrl : userDetails?.photoUrl) ||
    Placeholder;

  const backgroundSrc =
    (isCurrentUser
      ? activeUser?.background?.profileBackground ||
        userDetails?.background?.profileBackground
      : userDetails?.background?.profileBackground) || BgPlaceholder;

  const imageLoaded = useProfilePreloader([profileImageSrc, backgroundSrc]);

  useEffect(() => {
    if (editProfileToggled && !isCurrentUser) {
      setEditProfileToggled(false);
    }
  }, [isCurrentUser]);

  useEffect(() => {
    userId === currentUser.uid ? setCurrentUser(true) : setCurrentUser(false);
  }, [userId, currentUser.uid]);

  const closebutton = () => {
    setEditProfileToggled(false);
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

  if (!userDetails || UserProfileLoading || loadingFriends || !imageLoaded)
    return null;
  return (
    <>
      <div className="w-full flex-col flex grow">
        {/* Profile View */}
        {!editProfileToggled && (
          <>
            <ProfileBanner
              background={background}
              isCurrentUser={isCurrentUser}
              userDetails={userDetails}
              toggleProfileEdit={toggleProfileEdit}
              profileImageSrc={profileImageSrc}
              backgroundSrc={backgroundSrc}
            />
            {activeSection === "Posts" && (
              <ProfileMainContent
                userDetails={userDetails}
                activeUser={activeUser}
                handleClick={handleClick}
                handlePostClick={handlePostClick}
                setPostFullscreen={setPostFullscreen}
                friends={friends}
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
