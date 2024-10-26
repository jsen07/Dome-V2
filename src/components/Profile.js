import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { ref, set, child, get } from "firebase/database";
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from "firebase/storage";
import { db } from '../firebase';
import Placeholder from './images/avatar_placeholder.png';
import { updateProfile } from 'firebase/auth';
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';


const Profile = () => {

  const [userDetails, setUserDetails] = useState(null);
  const [editProfileToggled, seteditProfileToggled] = useState(false);
  const [changeAvatarToggled, setChangeAvatarToggled] = useState(false);
  const [photoURL, setPhotoURL] = useState();
  const [checkPhoto, setCheckPhoto] = useState();
  const [uploadPhoto, setUploadPhoto] = useState();
  const [loading, setLoading] = useState();
  const [{user}, dispatch] = useStateValue();
  const [status, setStatus] = useState('Offline');

  const { currentUser } = useAuth();
  const storage = getStorage();


  useEffect(() =>{

      const db_ref = db.ref();
      get(child(db_ref, `users/${currentUser.uid}`)).then((snapshot) => {
        if (snapshot.exists()) {
          const UserData = snapshot.val();
          setUserDetails(UserData)

          if(!currentUser.photoURL) {
          setPhotoURL(Placeholder);
          setCheckPhoto(false);
          }
          else {
            setPhotoURL(currentUser.photoURL);
            setCheckPhoto(true);
          }
          
        } else {
          console.log("No data available");
        }}).catch((error) => {
          console.error(error);
        });

  });

  useEffect(() => {
    if (!currentUser) return;

    const statusRef = db.ref(`status/${currentUser.uid}`);


    statusRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            setStatus(snapshot.val());
        }
    });


    const onStatusChange = statusRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            setStatus(snapshot.val());
        }
    });

    return () => {
        statusRef.off('value', onStatusChange);
    };
}, [currentUser]);
  
  const editProfileToggle = () => {
    seteditProfileToggled(!editProfileToggled);
    
  console.log(user?.uid)
  }

  const changeAvatarToggle = () => {
    setChangeAvatarToggled(!changeAvatarToggled);
  }

  const handleFileChange = (e) => {
    if(e.target.files[0]) {
      setUploadPhoto(e.target.files[0]);
    }
  }

  const handleFileUpload = async () => {

    const fileRef = sRef(storage, currentUser.uid + '.png');

    await uploadBytes(fileRef, uploadPhoto).then((snapshot) => {
      setLoading(true);
    });
    const photoLink = await getDownloadURL(fileRef);
         dispatch({
        type: actionTypes.SET_PROFILE,
        ...user,
        PhotoURL: photoLink

        
      })
      set(ref(db, `users/${currentUser.uid}`), {
        ...userDetails,
        photoUrl: photoLink
      })
    updateProfile(currentUser, {photoURL: photoLink });
    setPhotoURL(currentUser.photoURL);
    setCheckPhoto(true);
    setUploadPhoto(false);
    setLoading(false);

    // console.log(user);


  }
  
  const removeProfilePicture = () => {
    updateProfile(currentUser, {photoURL: "" });
    set(ref(db, `users/${currentUser.uid}`), {
      ...userDetails,
      photoUrl: ""
    })

    // dispatch({
    //   type: actionTypes.SET_PROFILE,
    //     ...user, 
    //     photoURL: 
    // })
  
  }

    const saveChanges = () => {

      const newDisplayName = document.getElementById("edit-display-name__box").value;
      const newBio = document.getElementById("edit-bio").value;
      const newGender = document.getElementById("edit-gender").value;

      updateProfile(currentUser, {displayName: newDisplayName });
      set(ref(db, `users/${currentUser.uid}`), {
        ...userDetails,
        Bio: newBio,
        displayName: newDisplayName,
        Gender: newGender
      })
      .then(() => {

        seteditProfileToggled(!editProfileToggled);

      })
      .catch((error) => {
        console.log(error.message);
      });
 


      }
if (loading) return <div className='loading'> LOADING... </div>
  return (
    <div className='profile__page'>

{!editProfileToggled &&(
<div className='profile__view'>
        <h1> {userDetails?.displayName } </h1>

        <div className='avatar__container'>
        <img alt="avatar" src={user?.photoURL ? user?.photoURL : photoURL } className='profile__icon'/>
        <div className={ status ? `status ${status}` : "status"} ></div>

        </div>

        <div className='user-profile__details'>
            <p> Unique ID: </p>
            <div className='profile-details'>{userDetails?.uid}</div>
            <p> Bio:</p>
            <div className='profile-details'>{userDetails?.Bio}</div>
            <p> Gender:</p>
            <div className='profile-details'>{userDetails?.Gender}</div>
            <p> Display name: </p>
            <div className='profile-details'>{userDetails?.displayName}</div>

            <p> Email: {userDetails?.email} </p>

            <button onClick={editProfileToggle}> Edit Profile </button>

        </div>
        </div>

)}

{editProfileToggled &&(
  <div className='edit-profile__view'>
    <div className='close-button'>
    <button onClick={editProfileToggle}> Close </button>
    </div>
<div className='edit-avatar'>
  <div className='avatar-container'>
<img alt="avatar" src={photoURL} className='profile__icon'/>
</div>
<button onClick={changeAvatarToggle}> Change Photo </button>
</div>

<div className='user-profile__details'>
            <p> Unique ID: {currentUser.uid} </p>
            <p> Display name </p>
            <input  id="edit-display-name__box" type="text" name="displayName" defaultValue={userDetails?.displayName}/>
            <p> Bio: </p>
            <textarea id="edit-bio" rows="4" cols="50" defaultValue={userDetails?.Bio}></textarea>
            <p> Gender: </p>
            <select id="edit-gender" name="gender">
              <option value={userDetails?.Gender} selected={userDetails?.Gender}></option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say"> Prefer not to say</option>
            </select>

            

            <p> Email: {userDetails?.email} </p>
</div>
<div className='edit-buttons__container'>
<button onClick={saveChanges}> Save </button>
</div>

{changeAvatarToggled &&(
  <div className='avatar-home'>
{checkPhoto &&(
  <div className='avatar__container'>

    <div className='upload-avatar__container'>

{/* <button onClick={changeAvatarToggle}> Close </button> */}

<button onClick={removeProfilePicture}>  Remove current Photo </button>
</div>

  </div>

)}
 {!checkPhoto &&(
  <div className='default-avatar__container'>

<input type="file" id="myFile" onChange={handleFileChange}/>

<button disabled={loading  || !uploadPhoto}onClick={handleFileUpload}>  Upload File </button>



  </div>


)}
</div>
)}
    </div>




)}
    </div>
  )
}
export default Profile