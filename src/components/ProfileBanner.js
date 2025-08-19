import React from "react";
import ProfileActionButtons from "./ProfileActionButtons";
import Placeholder from "./images/profile-placeholder-2.jpg";

const ProfileBanner = ({
  background,
  status,
  isCurrentUser,
  userDetails,
  toggleProfileEdit,
}) => {
  return (
    <div
      className="text-white relative w-full flex flex-col"
      // style={background ? { backgroundImage: `url(${background})` } : {}}
    >
      <div className="aspect-[16/5] relative overflow-hidden bg-neutral-800">
        <img
          alt="banner"
          src={background || Placeholder}
          className="w-full h-full object-cover object-center"
        />

        {isCurrentUser && (
          //   <button onClick={toggleProfileEdit}>
          //   Edit Profile
          // </button>

          <button
            className="bg-blue-600 px-4 py-2 text-white rounded-xl shadow-md text-sm absolute top-2 right-2"
            onClick={toggleProfileEdit}
          >
            {" "}
            Edit Profile{" "}
          </button>
        )}
        {!isCurrentUser && <ProfileActionButtons userDetails={userDetails} />}
      </div>
      <div className="pl-32 pr-2 text-2xl w-full flex justify-start relative">
        <img
          alt="avatar"
          src={userDetails?.photoUrl || Placeholder}
          className="w-28 border-8 border-neutral-950 rounded-full aspect-square object-cover absolute bottom-[-20px] left-3"
        />
        <h1 className="pl-4 pt-2 font-bold">{userDetails?.displayName}</h1>
      </div>
    </div>
  );
};

export default ProfileBanner;
