import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ref, set, child, get, getDatabase, onValue, serverTimestamp, push } from 'firebase/database';
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from 'firebase/storage';
import { db } from '../firebase';
import Placeholder from './images/profile-placeholder-2.jpg';
import { updateProfile } from 'firebase/auth';
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileComments from './ProfileComments';
import ProfileActionButtons from './ProfileActionButtons';
import Notifications from './Notifications';
import FriendsList from './FriendsList';
import ProfilePosts from './ProfilePosts';

const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [editProfileToggled, setEditProfileToggled] = useState(false);
  const [changeAvatarToggled, setChangeAvatarToggled] = useState(false);
  const [background, setBackground] = useState();

  const [loading, setLoading] = useState(false);
  const [{ user }, dispatch] = useStateValue();
  const [status, setStatus] = useState('Offline');
  const [isCurrentUser, setCurrentUser] = useState();

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const storage = getStorage();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');

  // console.log(location.search);
  // console.log(queryParams.get('userId'));


  function fetchUserProfile(userId) {
    return new Promise((resolve, reject) => {
      const db_ref = db.ref();
      get(child(db_ref, `users/${userId}`)).then((snapshot) => {
          setLoading(true);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserDetails(userData); // Update state with userData
            resolve(userData);
            setLoading(false)
          } else {
            reject("No data found for user");
            setLoading(false)
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          setLoading(false)
          reject(error);
        });
    });
  }

  function fetchUserBackground(userId) {
    return new Promise((resolve, reject) => {
      // setLoading(true)
      const db_ref = db.ref();
      get(child(db_ref, `users/${userId}/background`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setBackground(userData.profileBackground)
            resolve(userData);
 
          } else {
            setBackground('');

          }
        })
        .catch((error) => {
          console.log("Error fetching user background:", error);
 
          reject(error);
        });
    });
  }

  useEffect(() => {
  
    fetchUserProfile(userId)
      .then(userData => {
        if (userData.uid === currentUser?.uid) {
          setCurrentUser(true);
        } else {
          setCurrentUser(false);
        }
        // console.log(userDetails)
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });

      fetchUserBackground(userId);
  }, [userId, currentUser?.uid]);


  useEffect(() => {
    const statusRef = ref(getDatabase(), `status/${userId}`);
    onValue(statusRef, (snapshot) => {
      if(snapshot.exists()) {
        const status = snapshot.val();
        setStatus(status);
      }

    })},[userId])

  useEffect (()=> {
    if (!currentUser) return;
    if(userId === currentUser?.uid) {
    const userRef = ref(getDatabase(), `users/${currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if(snapshot.exists()) {
        setUserDetails(snapshot.val());
      }
      else {
        console.log('no user data');
      }
    });

    return () => unsubscribe();
  }

  }, [currentUser])

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

  const handleBackgroundChange = (e) => {
    if (e.target.files[0]) {
      handleBackgroundFile(e.target.files[0]);
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

  useEffect(() => {
    const backgroundRef = ref(getDatabase(), `users/${userId}/background`);
    onValue(backgroundRef, (snapshot) => {
      if(snapshot.exists()) {
        const background = snapshot.val();
        setBackground(background.profileBackground);
      }
      else {
        setBackground('');
      }

    })},[userId])


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
          setEditProfileToggled(false);
        })
        .catch((error) => {
          console.error("Error saving changes:", error);
        });
    });
  };

  const closeButton = () => {
    setEditProfileToggled(false)
    setChangeAvatarToggled(false)
  }

  if (loading) return <div className="loading">LOADING...</div>;

  return (
    // <div className="profile__background" style={background ? { backgroundImage: `url(${background})` } : {}}>
    <div className="profile__background">
      <div className="profile__page">
        {/* Profile View */}
        {!editProfileToggled && (
          <div className="profile__view">

            <div className='header__banner'style={background ? { backgroundImage: `url(${background})` } : {}}>
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
                <button onClick={() => setEditProfileToggled(true)}>
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

        <div className="profile-contents">
          <div className='main__left'>
          <div className='profile-bio'>
            <h3>About me </h3>
              <p>{userDetails?.Bio || 'This poohead has not set up their bio '}</p>
              </div>

              <FriendsList  user ={userDetails?.uid}/>

              </div>
            
            <div className='main__right'>
              <ProfilePosts  user={userDetails?.uid}/>
              </div>

              
          </div>

            {/* <div className="user-profile__details">
              <p>Unique ID:</p>
              <div className="profile-details">{userDetails?.uid}</div>
              <p>Bio:</p>
              <div className="profile-details">{userDetails?.Bio}</div>
              <p>Gender:</p>
              <div className="profile-details">{userDetails?.Gender}</div>
              <p>Display name:</p>
              <div className="profile-details">{userDetails?.displayName}</div>
              <p>Email: {userDetails?.email}</p>
              {!isCurrentUser && (   
                <ProfileActionButtons userDetails={userDetails}/>
              )}

              {isCurrentUser && (   
                <button onClick={() => setEditProfileToggled(true)}>
                Edit Profile
              </button>
            )}
            </div> */}
          </div>
     )}
     {editProfileToggled && isCurrentUser && (
          /* Edit Profile View */
          <div className="edit-profile__view">
            <div className="close-button">
              <button onClick={closeButton}>Close</button>
            </div>
            <div className="edit-avatar">
              <div className="avatar-container">
                <img alt="avatar" src={userDetails?.photoUrl || Placeholder} className="profile__icon" />
              </div>
              <button onClick={() => setChangeAvatarToggled(!changeAvatarToggled)}>
                Change Photo
              </button>
            </div>

            <div className="user-profile__details">
              <p>Unique ID: {currentUser.uid}</p>
              <p>Display name</p>
              <input
                id="edit-display-name__box"
                type="text"
                defaultValue={userDetails?.displayName}
                disabled={!isCurrentUser}
              />
              <p>Bio:</p>
              <textarea
                id="edit-bio"
                rows="4"
                defaultValue={userDetails?.Bio}
                disabled={!isCurrentUser}
              ></textarea>
              <p>Gender:</p>
              <select
                id="edit-gender"
                name="gender"
                defaultValue={userDetails?.Gender}
                disabled={!isCurrentUser}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <p>Email: {userDetails?.email}</p>
              <p> change profile background </p>
              <input type="file" disabled={!isCurrentUser}onChange={handleBackgroundChange} />
            </div>
            {isCurrentUser && (
              <div className="edit-buttons__container">
                <button onClick={saveChanges}>Save</button>
              </div>
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
  )}
      </div>
<div className='profile-panel__container' >
  {isCurrentUser && (
          <Notifications />
  )}
      <ProfileComments user={userDetails}/>
      </div>
    </div>
  );
};

export default Profile;
