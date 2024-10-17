import React, { useEffect, useState} from 'react'
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import Profile from './Profile';
import { db } from '../firebase';
import { child, get } from "firebase/database";
import Placeholder from './images/avatar_placeholder.png';
import { useStateValue } from './contexts/StateProvider';

const Home = () => {

const { logout, currentUser } = useAuth();
const navigate = useNavigate();
const [photoURL, setPhotoURL] = useState();
const [profileToggle, setProfileToggle] = useState(false);
const [{user}, dispatch] = useStateValue();

useEffect(() =>{
  if(!user?.photoURL) {
    setPhotoURL(Placeholder);
  } else {
    setPhotoURL(user?.photoURL);
  }

  writeUserData(user?.uid, user?.displayName, user?.email);
  console.log(user);
  // console.log({user});

},[currentUser]);

useEffect(() =>{
  if(!user?.photoURL) {
    setPhotoURL(Placeholder);
  } else {
    setPhotoURL(user?.photoURL);
  }

},[user?.photoURL]);

function writeUserData(userId, displayName, email) {

  const db_ref = db.ref();
  get(child(db_ref, `users/${userId}`)).then((snapshot) => {
    if (!snapshot.exists()) {
      db_ref.child('users/' + userId).set({
        photoUrl: "",
        displayName: displayName,
        Bio: "",
        Gender: "Prefer not to say",
        email: email
      })
    } 
  }).catch((error) => {
    console.error(error);
  });
}

function handleLogout() {
    alert('Youve been logged out');
    logout();
    navigate("/");
}

const toggleHandler = () => {
  setProfileToggle(!profileToggle);
  // console.log(profileToggle);
}

  return (
    <div className='home__container'> 
        <h1> Home page!!</h1>
        <div className='main__menu'>
          
          <div className='side-menu__bar'>
            <p>side menu </p>
            <img src={user?.photoURL ? user?.photoURL : photoURL} alt="avatar" className='profile__icon' onClick={toggleHandler}/>
            <button onClick={handleLogout} type='submit'>Logout</button>
          </div>
          
          
          {profileToggle &&(
          <Profile /> )}

          {!profileToggle &&(
            <div className='chat-list__container'>


            </div>
            )}

<div className='chat__container'>

  

</div>

        </div>
    </div>
  )
}

export default Home