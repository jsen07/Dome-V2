import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { ref, child, get, getDatabase, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import Placeholder from './images/avatar_placeholder.png';

const FriendsPanel = () => {
    const { currentUser } = useAuth();
    const [friends, setFriends] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [offlineUsers, setOfflineUsers] = useState([]);
    const navigate = useNavigate();


    useEffect(() => {
        if (!currentUser || !currentUser.uid) return; 
  
        const dbRef = ref(getDatabase(), `friendsList/${currentUser.uid}`);
  
        const fetchFriends = () => {
            onValue(dbRef, async (snapshot) => {
                const friendPromises = [];
    
  
                snapshot.forEach((childSnapshot) => {
                    const childData = childSnapshot.val();
                    const userPromise = get(child(ref(getDatabase()), `users/${childData.uid}`));
                    const statusPromise = get(child(ref(getDatabase()), `status/${childData.uid}`));
      
  
                    friendPromises.push(Promise.all([userPromise, statusPromise]).then(([userSnapshot, statusSnapshot]) => {
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.val();
                            const status = statusSnapshot.val();
  
                            return {
                                ...userData,
                                status,
                            };
                        } else {
                            return null;
                        }
                            }));
                    });
  
  
  
                try {
                    const friendObjects = await Promise.all(friendPromises);
                    setFriends(friendObjects)

                    const onlineUsers = friendObjects.filter(friend => friend.status === 'Online');
                    const offlineUsers = friendObjects.filter(friend => friend.status === 'Offline');
                    setOnlineUsers(onlineUsers);
                    setOfflineUsers(offlineUsers)
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            });
        };
  
        fetchFriends();
    }, [currentUser]); 
    
        useEffect(() => {
            const statusRef = ref(getDatabase(), 'status');
            onValue(statusRef, (snapshot) => {
                snapshot.forEach((childSnapshot) => {

                    const userId = childSnapshot.key;
                    const userStatus = childSnapshot.val()
           
 
                    setFriends((statusData) => {
                        return statusData.map(status => {
                            if(status.uid === userId) {
                                return { ...status,
                                    status: userStatus
                                };
                            }
                            return status;
                        })
                     })
                })

            })

    },[])

useEffect(()=>{
    const onlineUsers = friends.filter(friend => friend.status === 'Online');
    const offlineUsers = friends.filter(friend => friend.status === 'Offline');
    setOnlineUsers(onlineUsers);
    setOfflineUsers(offlineUsers)
    
},[friends])
  return (
    <div className='friendsPanel__home'>

{onlineUsers.length > 0 && (
    <div className='online__container'>
        <h4>Online</h4>
  
               {onlineUsers.map((friend, index) => {
                    return (
                        <div key={index} className='friend'>
                            <div className='profile'>           
                                <img src={friend?.photoUrl || Placeholder} alt="avatar" onClick={()=> navigate(`/profile?userId=${friend.uid}`)}/>
                                <div className={friend.status ? `status ${friend.status}` : 'status'}></div>
                                </div>
                                <p> {friend.displayName} </p>
                            </div>
                    )
                })}
                </div>
            )}

{offlineUsers.length > 0 && (
    <div className='offline__container'>
        <h4>Offline</h4>
  
               {offlineUsers.map((friend, index) => {
                    return (
                        <div key={index} className='friend'>
                            <div className='profile'>
                                <img src={friend?.photoUrl || Placeholder} alt="avatar" onClick={()=> navigate(`/profile?userId=${friend.uid}`)}/>
                                <div className={friend.status ? `status ${friend.status}` : 'status'}></div>
                                </div>
                                <p> {friend.displayName} </p>
                            </div>
                    )
                })}
                </div>
            )}
            </div>

)}

export default FriendsPanel