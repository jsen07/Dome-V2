import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ref, set, child, get, getDatabase, onValue } from 'firebase/database';
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from 'firebase/storage';
import { db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import ImageCropper from './ImageCropper';
import Placeholder from './images/profile-placeholder-2.jpg';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import Fade from '@mui/material/Fade';


const EditProfile = ( { userDetails, isCurrentUser, closeButton  } ) => {

    const { currentUser } = useAuth();
    const storage = getStorage();
    
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
    const [{ user }, dispatch] = useStateValue();
    const [changeAvatarToggled, setChangeAvatarToggled] = useState(false);

useEffect(()=> {
  setActive(true);
},[])
    const handleBackgroundChange = (e) => {
        if (e.target.files[0]) {
          handleBackgroundFile(e.target.files[0]);
        }
      };

      const removeProfilePicture = async () => {
        try {
          await updateProfile(currentUser, { photoURL: '' });
          await set(ref(db, `users/${currentUser.uid}`), {
            ...userDetails,
            photoUrl: '',
          });
          setChangeAvatarToggled(false)
        } catch (error) {
          console.error("Error removing profile picture:", error);
        }
      };
    

      const saveChanges = () => {
        const newDisplayName = document.getElementById("edit-display-name__box").value;
        const newBio = document.getElementById("edit-bio").value;
        const newGender = document.getElementById("edit-gender").value;
    
        updateProfile(currentUser, { displayName: newDisplayName }).then(() => {
          set(ref(db, `users/${currentUser.uid}`), {
            ...userDetails,
            Bio: newBio,
            displayName: newDisplayName,
            Gender: newGender,
          })
            .then(() => {
              closeButton();
            })
            .catch((error) => {
              console.error("Error saving changes:", error);
            });
        });
      };

      const handleFileChange = (e) => {
        if (e.target.files[0]) {
          // setUploadPhoto(e.target.files[0]);
          handleFileUpload(e.target.files[0]);
        }
      };
    
      const handleFileUpload = async (photo) => {
        setLoading(true);
        const fileRef = sRef(storage, `${currentUser.uid}.png`);
    
        try {
          await uploadBytes(fileRef, photo);
          const photoLink = await getDownloadURL(fileRef);
          dispatch({
            type: actionTypes.SET_PROFILE,
            ...user,
            PhotoURL: photoLink,
          });
    
          await set(ref(db, `users/${currentUser.uid}`), {
            ...userDetails,
            photoUrl: photoLink,
          });
    
          updateProfile(currentUser, { photoURL: photoLink });
     
          setChangeAvatarToggled(false)
          setLoading(false);
    
        } catch (error) {
          console.error("Error uploading file:", error);
          setLoading(false);
        }
      };

      const handleBackgroundFile = async (backgroundImage) => {

        setLoading(true);
        const fileRef = sRef(storage, `${currentUser.uid}-backgroundImage.png`);
    
        try {
          await uploadBytes(fileRef, backgroundImage);
          const photoLink = await getDownloadURL(fileRef);
    
          await set(ref(db, `users/${currentUser.uid}/background`), {
            profileBackground: photoLink
          });
          setLoading(false);
    
        } catch (error) {
          console.error("Error uploading file:", error);
          setLoading(false);
        }
      }

      const VisuallyHiddenInput = styled('input')({
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        left: 0,
        whiteSpace: 'nowrap',
        width: 1,
      });
  return (
    <Fade in={active}>
    <div className="edit-profile__view">
    <div className="edit__header">
    <h2> Edit Profile</h2>
      <Button variant="contained" className='close' onClick={closeButton} endIcon={<CloseRoundedIcon />}>
        Close
      </Button>
    </div>

    <div className='edit__container'>

    <div className="edit-avatar">
      <div className="avatar-container">
        <img alt="avatar" src={userDetails?.photoUrl || Placeholder} className="profile__icon" />
      </div>
      <div className='upload-profile'>
      {/* <Button className='upload' variant="outlined" onClick={() => setChangeAvatarToggled(!changeAvatarToggled)}>Upload new photo</Button> */}

      {isCurrentUser && userDetails?.photoUrl && (
              <Button variant="outlined" className='upload' onClick={removeProfilePicture}>
                Remove current Photo
              </Button>
            )}
            
      {isCurrentUser && !userDetails?.photoUrl &&(
        <>
        {/* <input type="file" disabled={!isCurrentUser}onChange={handleFileChange} /> */}
        <Button
        component="label"
        className='upload-button'
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<CloudUploadIcon />}
      >
        Upload profile
        <VisuallyHiddenInput
          type="file"
          disabled={!isCurrentUser}
          onChange={handleFileChange}
          multiple
        />
      </Button>
      </>
        )}

      <h3>Profile pictures use the aspect ratio of 1:1</h3>
      <h3> At least 400 x 400 pixels is recommended for the best results</h3>
      </div>
    </div>

    <div className="user-profile__details">
      {/* <p>Unique ID: {currentUser.uid}</p> */}
      <h4>Email: {userDetails?.email}</h4>
      <h4>Display name</h4>
      {/* <input
        id="edit-display-name__box"
        type="text"
        defaultValue={userDetails?.displayName}
        disabled={!isCurrentUser}
      /> */}
      <h4>Bio:</h4>
      {/* <textarea
        id="edit-bio"
        rows="4"
        defaultValue={userDetails?.Bio}
        disabled={!isCurrentUser}
      ></textarea> */}
      <h4>Gender:</h4>
      {/* <select
        id="edit-gender"
        name="gender"
        defaultValue={userDetails?.Gender}
        disabled={!isCurrentUser}
      >
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select> */}
      
    </div>
    {isCurrentUser && (
      <>
      <div className="edit-buttons__container">
        <button onClick={saveChanges}>Save changes</button>
      </div>
            {/* <p> change profile background </p>
            <ImageCropper handleBackgroundChange={handleBackgroundChange
            }/> */}
            </>
    )}

    {changeAvatarToggled && (
      <div className="avatar-home">
        <div className="avatar__container">
          <div className="upload-avatar__container">
          {isCurrentUser && userDetails?.photoUrl && (
              <button onClick={removeProfilePicture}>
                Remove current Photo
              </button>
            )}
          </div>
        </div>

        <div className="default-avatar__container">
        {isCurrentUser && !userDetails?.photoUrl &&(
 
              <input type="file" disabled={!isCurrentUser}onChange={handleFileChange} />
    
          )}
        </div>
      </div>
    )}
    </div>
  </div>
  </Fade>
  )
}

export default EditProfile