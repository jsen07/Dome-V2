import React from 'react'
import ProfileActionButtons from './ProfileActionButtons';
import Placeholder from './images/profile-placeholder-2.jpg';

const ProfileBanner = ({background, status, isCurrentUser, userDetails, toggleProfileEdit}) => {
  return (
    <div  id="banner" className='header__banner'style={background ? { backgroundImage: `url(${background})` } : {}}>
    <div className='profile-header'>
    <div className="avatar__container">
      <img
        alt="avatar"
        src={userDetails?.photoUrl || Placeholder}
        className="profile__icon"
      />
      <div className={status ? `status ${status}` : 'status'}></div>
    </div>
  <div className='header__container'>
    <div className='header__text'>
    <h1>{userDetails?.displayName}</h1>
    {isCurrentUser && (   
        <button onClick={toggleProfileEdit}>
        Edit Profile
      </button>
    )}
             {!isCurrentUser && (   
        <ProfileActionButtons userDetails={userDetails}/>
      )}
    </div>
  </div>
    </div>
    </div>
  )
}

export default ProfileBanner