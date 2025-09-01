import React from "react";
import ProfileActionButtons from "./ProfileActionButtons";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import { useNavigate } from "react-router-dom";

const ProfileBanner = ({
  isCurrentUser,
  userDetails,
  toggleProfileEdit,
  profileImageSrc,
  backgroundSrc,
}) => {
  const navigate = useNavigate();

  return (
    <div className="text-white relative w-full flex flex-col">
      <div className="aspect-[16/5] relative overflow-hidden bg-neutral-900">
        <img
          alt="banner"
          src={backgroundSrc}
          className="w-full h-full object-contain object-center"
        />
      </div>

      <div className="text-2xl w-full flex justify-start relative">
        <img
          alt="avatar"
          src={profileImageSrc}
          className="w-24 border-8 border-neutral-950 rounded-full aspect-square object-cover absolute bottom-[-40px] left-3"
        />
        {isCurrentUser && (
          <button
            className="border border-neutral-800 font-bold text-xs px-3 py-2 text-white rounded-2xl shadow-md text-sm absolute top-2 right-2 hover:cursor-pointer"
            onClick={toggleProfileEdit}
          >
            Edit Profile
          </button>
        )}
        {!isCurrentUser && <ProfileActionButtons userDetails={userDetails} />}
      </div>

      <div className="absolute top-0 text-white px-4 py-2 h-20 flex flex-row items-center gap-2 text-base z-20 w-full">
        <ArrowBackIosNewRoundedIcon
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="cursor-pointer hover:opacity-80"
        />
      </div>
    </div>
  );
};

export default ProfileBanner;
