import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { getDatabase, ref, get, child } from "firebase/database";
import Placeholder from "./images/profile-placeholder-2.jpg";

const LikeProfilesList = ({ postLikes }) => {
  if (!postLikes || postLikes.length === 0) return null;

  const firstTwoNames = postLikes.slice(0, 2).map((u) => u.displayName);
  const remainingCount = postLikes.length - 2;

  return (
    <div className="flex flex-row w-full items-center cursor-pointer">
      <div className="flex -space-x-2">
        {postLikes.slice(0, 3).map((user) => (
          <img
            key={user.uid}
            src={user.photoUrl || Placeholder}
            alt={user.displayName}
            className="w-6 h-6 aspect-square rounded-full border-2 border-neutral-950 object-cover"
          />
        ))}
      </div>

      <div className="text-sm text-white text-xs w-full gap-1 font-bold flex items-center tracking-tighter ml-2">
        <span className="font-bold">Liked by </span>
        <span className="max-w-[150px] truncate">
          {firstTwoNames.join(" and ")}
        </span>
        {remainingCount > 0 && <span> and others</span>}
      </div>
    </div>
  );
};

export default LikeProfilesList;
