import React, { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ref, set, child, get, getDatabase, onValue } from 'firebase/database';
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from 'firebase/storage';
import { db } from '../firebase';

import { useStateValue } from './contexts/StateProvider';
import { useLocation } from 'react-router-dom';
import ProfileComments from './ProfileComments';
import Notifications from './Notifications';
import ProfileMainContent from './ProfileMainContent';

import ProfileBanner from './ProfileBanner';
import Photos from './ProfileFilters/Photos';
import EditProfile from './EditProfile';

const Profile = () => {
  const [isComponentActive, setIsComponentActive] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [editProfileToggled, setEditProfileToggled] = useState(false);
  const [changeAvatarToggled, setChangeAvatarToggled] = useState(false);
  const [photosToggle, setPhotosToggle] = useState(false);
  const [background, setBackground] = useState();
  const [activeSection, setActiveSection] = useState('Posts');

  const [loading, setLoading] = useState(false);
  const [{ user }, dispatch] = useStateValue();
  const [status, setStatus] = useState('Offline');
  const [isCurrentUser, setCurrentUser] = useState();

  const { currentUser } = useAuth();
  const storage = getStorage();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');

  const handleSectionToggle = (section) => {
    setActiveSection(section);
  };

  useEffect(()=> {
    if(editProfileToggled && !isCurrentUser) {
      setEditProfileToggled(false);
    }
  },[isCurrentUser])

  function fetchUserProfile(userId) {
    return new Promise((resolve, reject) => {
      const db_ref = db.ref();
      setLoading(true);
      get(child(db_ref, `users/${userId}`)).then((snapshot) => {
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
      setLoading(true)
      const db_ref = db.ref();
      get(child(db_ref, `users/${userId}/background`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setBackground(userData.profileBackground)
            resolve(userData);
            setLoading(false)
 
          } else {
            setBackground('');
            setLoading(false)

          }
        })
        .catch((error) => {
          console.log("Error fetching user background:", error);
 
          reject(error);
          setLoading(false)
        });
    });
  }

  useEffect(()=> {
    setActiveSection('Posts');
  },[userId])
  
  useEffect(() => {
  
    fetchUserProfile(userId)
      .then(userData => {
        setLoading(true);
        if (userData.uid === currentUser?.uid) {
          setCurrentUser(true);
          setLoading(false)
        } else {
          setCurrentUser(false);
          setLoading(false)
        }
        // console.log(userDetails)
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setLoading(false)
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



  useEffect(() => {
    setIsComponentActive(true);
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




  const closeButton = () => {
    setEditProfileToggled(false)
    setChangeAvatarToggled(false)
  }
const toggleProfileEdit = () => {
  setEditProfileToggled(true);
}

return (
  <div className={`profile__background ${isComponentActive ? 'active' : ''}`}>
    <div className="profile__page">
      {loading ? (
        <div className='loading'></div>
      ) : (
        <>
          {/* Profile View */}
          {!editProfileToggled && !loading && (
            <div className="profile__view">
              <ProfileBanner 
                background={background} 
                status={status} 
                isCurrentUser={isCurrentUser} 
                userDetails={userDetails} 
                toggleProfileEdit={toggleProfileEdit} 
              />
              <div className="profile-links">
                <p onClick={() => handleSectionToggle('Posts')}>Posts</p>
                <p>About</p>
                <p>Friends</p>
                <p onClick={() => handleSectionToggle('Photos')}>Photos</p>
              </div>
              {activeSection === 'Posts' && <ProfileMainContent userDetails={userDetails} />}
              {activeSection === 'Photos' && <Photos userId={userId} />}
            </div>
          )}

          {editProfileToggled && isCurrentUser && (

            <EditProfile 
              userDetails={userDetails} 
              isCurrentUser={isCurrentUser} 
              closeButton={closeButton} 
            />
          )}
        </>
      )}
    </div>

    <div className="profile-panel__container">
      <ProfileComments user={userDetails} />
    </div>
  </div>
);
}

export default Profile;
