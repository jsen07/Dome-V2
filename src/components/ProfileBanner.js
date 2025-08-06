import React from 'react'
import ProfileActionButtons from './ProfileActionButtons';
import Placeholder from './images/profile-placeholder-2.jpg';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';

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
      <div className='header__t'>
    <h1>{userDetails?.displayName}</h1>
    <h2><i>Jayssen De Castro</i> </h2>
    </div>
    {isCurrentUser && (   
      //   <button onClick={toggleProfileEdit}>
      //   Edit Profile
      // </button>
      <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& > *': {
          m: 1,
        },
      }}
    >
      <ButtonGroup variant="outlined" aria-label="Basic button group">
  <Button className='edit-profile-button' onClick={toggleProfileEdit}> Edit Profile </Button>
</ButtonGroup>
</Box>
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