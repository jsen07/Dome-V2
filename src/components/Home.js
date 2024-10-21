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
import ChatList from './ChatList';


const Home = () => {

const { logout, currentUser } = useAuth();
const navigate = useNavigate();
const [profileToggle, setProfileToggle] = useState(false);
const [addFriendToggle, setAddFriendToggle] = useState(false);
const [toggle, setToggle] = useState();
const [{user}, dispatch] = useStateValue();

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
        email: user.email
      })
    }
  })
}


},[user]);

function handleLogout() {
    alert('Youve been logged out');
    logout();
    navigate("/");
}

const toggleProfileHandler = () => {
  setProfileToggle(!profileToggle);

  if(addFriendToggle) {
    setAddFriendToggle(!addFriendToggle);
    // setToggle(toggle);
    }
}

const toggleAddFriendHandler = () => {
  setAddFriendToggle(!addFriendToggle);
  if(profileToggle) {
  setProfileToggle(!profileToggle);
  // setToggle(toggle);
  }
}
const toggleHandler = () => {
setToggle(toggle);

}

useEffect(() =>{
  if(!addFriendToggle && !profileToggle) {
    setToggle(true);
  }
  else {
    setToggle(false);
  }
},[profileToggle, addFriendToggle]);
  return (
    <div className='home__container'> 
        <h1> Homepage </h1>
        <div className='main__menu'>
          <div className='side-menu__bar'>
            <p>side menu </p>


            <div className='side-bar__icon' id="profile__icon" onClick={toggleProfileHandler}>
            </div>

            <div className='side-bar__icon' id="add-friend__icon" onClick={toggleAddFriendHandler}>

            </div>

            <button onClick={handleLogout} type='submit'>Logout</button>
        
          </div>

          {/* <div className='side-bar__panel'> */}

          {profileToggle &&(
          <Profile /> )}

          {/* {!toggle &&(
            <div className='chat-list__container'>

              <h1> THIS IS THE CHAT LIST CONTAINER</h1>

            </div>

            )} */}
          
          
          {addFriendToggle &&(
          <SearchUser /> )}


{/* </div> */}
{toggle &&(
<div className='chat-list__container'>

  <h1> {user.displayName}</h1>
<ChatList />
  

</div>

)}    
<div className='chat__container'>


<Chat />
  

</div>

        </div>
    </div>

  )
}

export default Home