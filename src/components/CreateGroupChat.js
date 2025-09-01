import React, { useState, useEffect } from "react";
import {
  ref,
  onValue,
  getDatabase,
  get,
  push,
  set,
  serverTimestamp,
} from "firebase/database";
import { useSelector } from "react-redux";

import Placeholder from "./images/profile-placeholder-2.jpg";
import { useNavigate } from "react-router-dom";
import ClickAwayListener from "@mui/material/ClickAwayListener";

const CreateGroupChat = ({ createGroupChatToggle }) => {
  const [userList, setUserList] = useState([]);
  const [searchedIDs, setSearchedIds] = useState([]);
  const [error, setError] = useState();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user.activeUser);

  const searchUserByID = async () => {
    const dbRef = ref(getDatabase(), `users`);
    const searchValue = document.getElementById("search-user__box").value;

    try {
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        onValue(dbRef, (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const childKey = childSnapshot.key;
            const childData = childSnapshot.val();

            if (
              childKey !== user.uid &&
              childData.displayName === searchValue
            ) {
              if (
                !userList.some((existingUser) => existingUser.uid === childKey)
              ) {
                setError("");
                setUserList((prev) => [...prev, childData]);
                setSearchedIds((prev) => [...prev, childKey]);
              }
            }
          });
        });
      }
    } catch (error) {
      console.log(error);
      setError(error);
    }
    if (!searchedIDs.includes(user.uid)) {
      setSearchedIds((prev) => [...prev, user.uid]);
    }
  };

  const createGroupChat = async () => {
    const dbRef = ref(getDatabase(), `chat`);
    const chatSnapshot = await get(dbRef);
    const chatRef = ref(getDatabase(), "chat");
    const newChatRef = push(chatRef);
    const chatKey = newChatRef.key;
    let names = [];

    userList.forEach((user) => {
      names.push(user.displayName);
    });

    let n = names.join(", ");
    const groupChatName = user.displayName + ", " + n;

    const chatData = {
      name: groupChatName,
      createdAt: serverTimestamp(),
      admin: [user.uid],
      messages: {},
      allowedUsers: searchedIDs,
    };
    if (userList.length >= 2 && searchedIDs.length !== 0) {
      if (chatSnapshot.exists()) {
        await set(ref(getDatabase(), `groupChat/${chatKey}`), chatData);
        navigate(`/home/groupchat/${chatKey}`);
      } else {
        setError("Something went wrong :(");
      }
      if (!chatSnapshot.exists()) {
        await set(ref(getDatabase(), `chat/${chatKey}`), chatData);
        navigate(`/home/groupchat/${chatKey}`);
      }
    } else {
      setError(
        "Group chat creation requires a minimum of 3 members. Please add more people!"
      );
    }
  };
  return (
    <ClickAwayListener onClickAway={createGroupChatToggle}>
      <div className="createGroupChat__modal">
        <h1>Create a Group chat </h1>
        <button onClick={createGroupChatToggle}>Close</button>

        <div className="search-form__container">
          <input id="search-user__box" type="text" name="search-bar" />
          {error && <p>{error}</p>}
          {/* {searchedIDs && searchedIDs.map((data, key) => (
           <p>{data}</p>
        ))}
       */}
          <button onClick={searchUserByID}> Search </button>
        </div>

        {userList &&
          userList.map((data, key) => (
            <div className="searched-user__box">
              <div className="searched-user__profile">
                <img src={data.photoUrl || Placeholder} alt="User Avatar" />
              </div>
              <div className="searched-user__view">
                <div className="searched-dp">
                  <p>{data.displayName}</p>
                </div>
                <div className="searched-view">
                  {/* <div id="view-user" onClick={viewToggle}></div> */}
                </div>
              </div>
            </div>
          ))}
        <h2 onClick={createGroupChat}>Create</h2>
      </div>
    </ClickAwayListener>
  );
};

export default CreateGroupChat;
