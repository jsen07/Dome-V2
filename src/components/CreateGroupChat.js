<<<<<<< HEAD
import React from 'react'

const CreateGroupChat = () => {
  return (
    <div>Create GROUP CHAT HERE </div>
=======
import React, { useState } from 'react'
import { ref, onValue, getDatabase, get, push, set, serverTimestamp } from "firebase/database";
import {  useStateValue } from './contexts/StateProvider';
import Placeholder from './images/avatar_placeholder.png';
import { useNavigate } from "react-router-dom";

const CreateGroupChat = ({createGroupChatToggle}) => {

  const[userList, setUserList] = useState([]);
  const [searchedIDs, setSearchedIds] = useState([]);
  const [error, setError] = useState();
  const navigate = useNavigate();

  const [{ user }] = useStateValue();


  const searchUserByID = async () => {
    const dbRef = ref(getDatabase(), `users`);
    const searchValue = document.getElementById("search-user__box").value;

    try {
const snapshot = await get(dbRef);

if(snapshot.exists()) {

onValue(dbRef, (snapshot) => {
snapshot.forEach((childSnapshot) => {
    const childKey = childSnapshot.key;
    const childData = childSnapshot.val();

    if (childKey !== user.uid && childData.displayName === searchValue) {
      if (!userList.some(existingUser => existingUser.uid === childKey)) {
        setError('')
        setUserList(prev => [...prev, childData]);
        setSearchedIds(prev => [...prev, childKey]);
      }
    }

})

})
}
    }
    catch(error){
      console.log(error);
      setError(error);
    }
    if (!searchedIDs.includes(user.uid)) {
      setSearchedIds(prev=>[...prev, user.uid])
    }

}

const createGroupChat = async () => {
  const dbRef = ref(getDatabase(), `chat`);
  const chatSnapshot = await get(dbRef);
  const chatRef = ref(getDatabase(), 'chat');
  const newChatRef = push(chatRef);
  const chatKey = newChatRef.key;
  let names = [];

  userList.forEach(user => {
    names.push(user.displayName)
    
  });

  let n = names.join(', ');
  const groupChatName = user.displayName+', '+ n;

  const chatData = {
    name: groupChatName,
    createdAt: serverTimestamp(),
    messages: {},
    allowedUsers: searchedIDs
};
if(userList.length !== 0 && searchedIDs.length !== 0 ) {
  if(chatSnapshot.exists()) {

    await set(ref(getDatabase(), `groupChat/${chatKey}`), chatData);
    navigate(`/home/groupchat/${chatKey}`);

  }
  else {
    setError('Something went wrong :(')
  }
  if(!chatSnapshot.exists()) {
    await set(ref(getDatabase(), `chat/${chatKey}`), chatData);
    navigate(`/home/groupchat/${chatKey}`);
  }
}

}
  return (
    <div className='createGroupChat__modal'>
      <h1>Create a Group chat </h1>
      <button onClick={createGroupChatToggle}>Close</button>

      <div className='search-form__container'>
        <input id="search-user__box" type="text" name="search-bar" />
        {error && <p>{error}</p>}
        {searchedIDs && searchedIDs.map((data, key) => (
           <p>{data}</p>
        ))}
      
        <button onClick={searchUserByID}> Search </button>
    </div>


     {userList && userList.map((data, key) => (
                   <div className='searched-user__box'>
                   <div className='searched-user__profile'>
                       <img src={data.photoUrl || Placeholder} alt="User Avatar" />
                   </div>
                   <div className='searched-user__view'>
                       <div className='searched-dp'>          
                           <p>{data.displayName}</p>
                       </div>
                       <div className='searched-view'>
                           {/* <div id="view-user" onClick={viewToggle}></div> */}
                       </div>
                   </div>
               </div>
     ))
    }
    <h2 onClick={createGroupChat}>Create</h2>
      </div>
>>>>>>> 58f1642 (group chat path added)
  )
}

export default CreateGroupChat