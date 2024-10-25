import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import Profile from './Profile';
import SearchUser from './SearchUser';
import { db } from '../firebase';
import { child, get } from "firebase/database";
import Placeholder from './images/avatar_placeholder.png';
import AddFriend from './images/add-friend-svgrepo-com.svg';
import { useStateValue } from './contexts/StateProvider'
import Chat from './Chat';
import Sidebar from './Sidebar';
import ChatList from './ChatList';
import Chatbot from './Chatbot';


const Home = () => {

const [{user}] = useStateValue();


useEffect(() =>{
  
if(user) {
  
  
  const db_ref = db.ref();
  get(child(db_ref, `users/${user.uid}`)).then((snapshot) => {
    if (!snapshot.exists()) {
      db_ref.child('users/' + user.uid).set({
        photoUrl: "",
        displayName: user.displayName,
        Bio: "",
        Gender: "Prefer not to say",
        email: user.email,
        uid: user.uid
      })
    }
  })
}


},[user]);


  return (
    <div className='home__container'> 
            <Sidebar />

            {/* <Chatbot /> */}
    </div>

  )
}

export default Home