import React, { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { ref, child, get, getDatabase } from "firebase/database";
import { useNavigate } from "react-router-dom";
import Placeholder from "../components/images/profile-placeholder-2.jpg";

const FriendsList = ({
  user,
  setFriendsLength,
  showFriends,
  hideFriendsList,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const friendsRef = ref(getDatabase());
      const snapshot = await get(
        child(friendsRef, `friendsList/${user}/friends`)
      );

      if (snapshot.exists()) {
        const friendsArr = [];

        const promises = [];

        snapshot.forEach((childSnapshot) => {
          const friendIds = childSnapshot.val();
          const userRef = ref(getDatabase(), `users/${friendIds}`);
          promises.push(
            get(userRef).then((userSnapshot) => {
              if (userSnapshot.exists()) {
                friendsArr.push(userSnapshot.val());
              }
            })
          );
        });

        await Promise.all(promises);
        setFriends(friendsArr);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    setFriendsLength(friends.length);
  }, [friends, setFriendsLength]);
  return (
    <>
      {showFriends && (
        <div className="border">
          <div className="flex flex-row justify-between w-full">
            <h1>{friends?.length} Friends </h1>
            <button onClick={hideFriendsList}> hide</button>
          </div>
          <p className="w-full text-center">I'm still working on this 😔</p>

          <div className="border">
            {friends.length > 0 &&
              friends.map((friend, index) => {
                return (
                  <div
                    key={index}
                    className="border flex flex-row items-center gap-2 cursor-pointer"
                  >
                    <img
                      src={friend.photoUrl || Placeholder}
                      alt="avatar"
                      onClick={() => {
                        hideFriendsList();
                        navigate(`/profile?userId=${friend.uid}`);
                      }}
                      className="w-10 rounded-full aspect-square object-cover"
                    />

                    <p> {friend.displayName} </p>
                  </div>
                );
              })}
            {friends.length === 0 && <p> This poohead is a loner </p>}
          </div>
        </div>
      )}
      {/* {!showFriends && <span> HELLO </span>} */}
    </>
  );
};

export default FriendsList;
