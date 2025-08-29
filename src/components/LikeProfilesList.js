import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { getDatabase, ref, get, child } from "firebase/database";
import Placeholder from "./images/profile-placeholder-2.jpg";

const LikeProfilesList = ({ postLikes, isLikedListLoading }) => {
  const [profileData, setProfileData] = useState([]);

  const fetchUserProfile = async () => {
    try {
      isLikedListLoading(true);
      const dbRef = ref(getDatabase());

      const snapshots = await Promise.all(
        postLikes.map((userId) => get(child(dbRef, `users/${userId}`)))
      );

      const users = snapshots
        .filter((snap) => snap.exists())
        .map((snap) => {
          const user = snap.val();
          return {
            displayName: user.displayName,
            photoUrl: user.photoUrl || "",
            uid: user.uid,
          };
        });

      setProfileData(users);
    } catch (error) {
      isLikedListLoading(false);
      console.error("Error fetching profiles:", error);
    } finally {
      isLikedListLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [postLikes]);

  if (!profileData.length) return null;

  const firstTwoNames = profileData.slice(0, 2).map((u) => u.displayName);
  const remainingCount = profileData.length - 2;
  // console.log(firstTwoNames);

  return (
    <div className="flex flex-row w-full items-center cursor-pointer">
      <div className="flex -space-x-2">
        {profileData.slice(0, 3).map((user) => (
          <img
            key={user.uid}
            src={user.photoUrl || Placeholder}
            alt={user.displayName}
            className="w-6 h-6  aspect-square rounded-full border-2 border-neutral-950 object-cover"
          />
        ))}
      </div>

      <div className="text-sm text-white text-xs w-full gap-1 font-bold flex items-center tracking-tighter ml-2">
        <span className="font-bold">Liked by </span>{" "}
        <span className="max-w-[150px] truncate">
          {" "}
          {firstTwoNames.join(" and ")}
        </span>
        {remainingCount > 0 && <span> and others</span>}
      </div>
    </div>
  );
};

export default LikeProfilesList;
