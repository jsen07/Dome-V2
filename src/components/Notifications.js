import React, { useState, useEffect } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { useAuth } from './contexts/AuthContext';
import { ref, child, get, getDatabase, remove, set } from 'firebase/database';
const Notifications = () => {

const [{ user }] = useStateValue();
const { currentUser } = useAuth();
const [requestList, setRequestList] = useState([]);


function formatTimestamp(timestamp) {
    const timestampDate = new Date(timestamp);
    let hours = timestampDate.getHours();       // Get hours
    const minutes = timestampDate.getMinutes()
    let dayOrNight = "";
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    if(hours >= 12) {
        dayOrNight = "PM"
    }
    if(hours === 0 || hours < 12) {
        dayOrNight ="AM"
    }
    if( hours === 0 ) {
        hours = 12;
    }

    const timeOfMessage = `${hours}:${String(minutes).padStart(2, '0')} ${dayOrNight}`;
    if (timestampDate >= todayStart) {
        
        return timeOfMessage;

    } else if (timestampDate >= yesterdayStart) {
        return "Yesterday";
    } else if (timestampDate >= startOfWeek) {
        const dayOfWeek = timestampDate.toLocaleString('en-US', { weekday: 'long' });
        return dayOfWeek;
    } else {
        return timestampDate.toLocaleDateString("en-US", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        }
    }

// GET USER FRIEND REQUESTS
const checkForFriendRequests = async () => {
    try {
        const friendsRef = ref(getDatabase());
        const snapshot = await get(child(friendsRef, `friendRequests/${user.uid}`));
        
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data;

        } else {
            console.log(' no data found');
            return null;

        }
      } catch (error) {
        console.error("Error checking friends:", error);
      }
    };
// SET FRIEND REQUEST LIST
useEffect(() => {
    if (!currentUser) return 

    const getRequestList = async () => {
        const requests = await checkForFriendRequests();
        if(requests !== null) {
            const requestArray = Object.values(requests);
            setRequestList(requestArray);
        } else {
            setRequestList([]);
        }
    }
getRequestList();
}, [currentUser])

const handleReject = async (userId) => {
    try {
    const friendsRef = ref(getDatabase());
    const snapshot = await get(child(friendsRef, `friendRequests/${currentUser.uid}`));

    if (snapshot.exists()) {
        const data = snapshot.val();
        const requests = Object.values(data);
        const filtered = requests.filter(data => data.uid !== userId);

        if (filtered.length === 0) {
            await remove(child(friendsRef, `friendRequests/${currentUser.uid}`))
        }
        else {
            await set(child(friendsRef, `friendRequests/${currentUser.uid}`), filtered);
        }
        setRequestList(filtered);
    }
    else {
        console.log('no friend requests')
    }
    }
    catch(error) {
        console.log(error);
    }
}

const handleAccept = async (userId, displayName, photoURL) => {

    const friendsData = {
        displayName: displayName,
        photoUrl: photoURL,
        uid: userId

    }
    const currentUserData = {
        displayName: currentUser.displayName,
        photoUrl: currentUser.photoURL,
        uid: currentUser.uid
    }
    try {
        const friendsRef = ref(getDatabase());
        const friendsListRef = ref(getDatabase(), `friendsList/${currentUser.uid}/${userId}`);
        const recieverFriendsListRef = ref(getDatabase(), `friendsList/${userId}/${currentUser.uid}`);

        await set(friendsListRef, friendsData);
        await set (recieverFriendsListRef, currentUserData);

        const requestListArray = Object.values(requestList);
        const filteredRequestList = requestListArray.filter(data => data.uid !== userId);

        await set(child(friendsRef, `friendRequests/${currentUser.uid}`), filteredRequestList);
        setRequestList(filteredRequestList)

    }
    catch(error) {
        console.log(error)
    }

}
return (
    requestList && requestList.length > 0 ? (
      <div className="notifications__container">
        <div className="notification-header">
          <h1> Notifications </h1>
          <div className="notification__tabs">
            <h3> Friend Requests </h3>
            <h3> All </h3>
          </div>
        </div>
        <div className="notification__content">
          {requestList.map(({ uid, displayName, timestamp, photoUrl }, index) => (
            <div key={uid} className="request__container">
              <div className="time__header">
                <p>{formatTimestamp(timestamp)}</p>
              </div>
              <p>{displayName} would like to send you a friend request</p>
              <div className="request__action-buttons">
                <button onClick={() => handleAccept(uid, displayName, photoUrl || "")}> Accept </button>
                <button onClick={() => handleReject(uid)}> Reject </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="notifications__container">
        <h1> Notifications </h1>
        <p>No new notifications at the moment.</p>
      </div>
    )
  );
  
}

export default Notifications