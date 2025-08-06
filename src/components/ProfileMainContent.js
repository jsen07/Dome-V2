import React from 'react'
import FriendsList from './FriendsList';
import ProfilePosts from './ProfilePosts';
const ProfileMainContent = ({userDetails,handleClick, handlePostClick, setPostFullscreen}) => {
  return (
    <div className="profile-contents">
          
    <div className='main__left'>
    <div className='profile-bio'>
      <h3>About me </h3>
        <p>{userDetails?.Bio || 'This poohead has not set up their bio '}</p>
        </div>

        <FriendsList  user ={userDetails?.uid}/>

        </div>
      
      <div className='main__right'>
        <ProfilePosts  user={userDetails?.uid} handleClick={handleClick} handlePostClick={handlePostClick} setPostFullscreen={setPostFullscreen}/>
        </div>

        
    </div>
  )
}

export default ProfileMainContent