import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Placeholder from './images/avatar_placeholder.png';

const FriendsList = ( {user}) => {

    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);

const fetchFriends = async () => {
if(!currentUser) return
    try {
        const friendsRef = ref(getDatabase());
        const snapshot = await get(child(friendsRef, `friendsList/${user}`));

        if(snapshot.exists()) {
            const friendsArray = Object.values(snapshot.val());
            setFriends(friendsArray)
        }
        else {
            setFriends([]);
        }
    }
    catch(error) {
        console.log(error);
    }
}

useEffect(() => {
fetchFriends();
},[user])

  return (
    <div className='friends-list__container'>
        <div className='friends-list__header'>
            <h1> Friends </h1>
        </div>
            <div className='friends__container'>
                {friends && friends.map((friend, index) => {
                    return (
                        <div key={index} className='friend'>
                            <div className='profile'>
                                <img src={friend.photoUrl || Placeholder} alt="avatar" onClick={()=> navigate(`/profile?userId=${friend.uid}`)}/>
                                </div>
                                <p> {friend.displayName} </p>
                            </div>
                    )
                })}
            </div>
    </div>
  )
}

export default FriendsList