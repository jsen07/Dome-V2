import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Placeholder from '../components/images/profile-placeholder-2.jpg';
import Skeleton from '@mui/material/Skeleton';
const FriendsList = ( {user}) => {

    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchFriends = async () => {
      if (!currentUser) return;
      setLoading(true);
    
      try {
        const friendsRef = ref(getDatabase());
        const snapshot = await get(child(friendsRef, `friendsList/${user}`));
    
        if (snapshot.exists()) {
          const friendsArr = [];
          // console.log(snapshot.val());
    
          const promises = [];
    
          snapshot.forEach((childSnapshot) => {
            const friendIds = childSnapshot.val();
            const userRef = ref(getDatabase(), `users/${friendIds.uid}`);
            promises.push(
              get(userRef).then((userSnapshot) => {
                if (userSnapshot.exists()) {
                  friendsArr.push(userSnapshot.val());
                }
              })
            );
          });
    
          await Promise.all(promises);
          setFriends(friendsArr);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

useEffect(() => {
fetchFriends();
},[user])

  return (
    <div className='friends-list__container'>

        
        <div className='friends-list__header'>
        <h1> Friends </h1>
        <p> {friends?.length} Friends </p>
    </div>


        <div className='friends__container'>
              {loading ? (
                <>
              <Skeleton className='friends-skeleton' variant="circular"/>
              <Skeleton className='friends-skeleton' variant="circular"/>
              <Skeleton className='friends-skeleton' variant="circular"/>
              </>
      ) : (
        <>
            {friends.length > 0 && friends.map((friend, index) => {
                return (
                    <div key={index} className='friend'>
                        <div className='profile'>
                            <img src={friend.photoUrl || Placeholder} alt="avatar" onClick={()=> navigate(`/profile?userId=${friend.uid}`)}/>
                            </div>
                            <p> {friend.displayName} </p>
                        </div>

                        
                )
            })}
            {friends.length === 0 && (
              <p> This poohead is a loner </p>
            )}
                       </>

       )}
        </div>

      
    

    </div>
  )
}

export default FriendsList