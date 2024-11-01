import React, { useEffect, useState } from 'react';
import { ref, child, get, getDatabase, onValue } from "firebase/database";
import { useStateValue } from './contexts/StateProvider';
import Placeholder from './images/avatar_placeholder.png';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from './contexts/AuthContext';

const ChatList = () => {

    
    const [chatList, setChatList] = useState([]);
    const [{ user }] = useStateValue();
    const navigate = useNavigate();

    const { currentUser } = useAuth();


    useEffect(() => {
        if (!user || !user.uid) return; 

        const dbRef = ref(getDatabase(), `chatList/${user.uid}`);

        const fetchChats = () => {
            onValue(dbRef, async (snapshot) => {
                const chatPromises = [];
                const allChat = [];

                snapshot.forEach((childSnapshot) => {
                    const childData = childSnapshot.val();
                    const userPromise = get(child(ref(getDatabase()), `users/${childData.receiverId}`));
                    const statusPromise = get(child(ref(getDatabase()), `status/${childData.receiverId}`));

                    chatPromises.push(Promise.all([userPromise, statusPromise]).then(([userSnapshot, statusSnapshot]) => {
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.val();
                            const status = statusSnapshot.val();
                            return {
                                ...childData,
                                ...userData,
                                status
                            };
                        } else {
                            console.log("No data for user:", childData.receiverId);
                            return null;
                        }
                            }));
                    });



                try {
                    const chatObjects = await Promise.all(chatPromises);
                    const filteredChats = chatObjects.filter(chat => chat !== null); 
                    setChatList(filteredChats.sort((a, b) => b.updatedAt - a.updatedAt));
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            });
        };

        fetchChats();

    }, [user]); 

    //Listener for updates on user status'

    useEffect(() => {
        const statusRef = ref(getDatabase(), 'status');
        onValue(statusRef, (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                //get user id and status 
                const userId = childSnapshot.key;
                const userStatus = childSnapshot.val()

                //map through chatlist and update user status on change
                setChatList((chatData) => {
                    return chatData.map(chat => {
                        if(chat.receiverId === userId) {
                            return { ...chat,
                                status: userStatus
                            };
                        }
                        return chat;
                    })
                 })
            })
        })},[])

        useEffect(() => {
            const chatRef = ref(getDatabase(), `chatList/${user.uid}`);
            const unsubscribe = onValue(chatRef, (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    const chatData = childSnapshot.val();
                    // If isSeen property changes, update the corresponding chat in chatList
                    setChatList((prevChatList) => {
                        return prevChatList.map(chat => {
                            if (chat.chatId === chatData.chatId) {
                                return { ...chat, isSeen: chatData.isSeen }; // Update isSeen status
                            }
                            return chat;
                        });
                    });
                });
            });
    
            return () => unsubscribe(); // Cleanup listener on unmount
        }, [user.uid]);

          function formatTimestamp(timestamp) {
            const timestampDate = new Date(timestamp);
            const now = new Date();
        
            // Start of today and yesterday
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        
            if (timestampDate >= todayStart) {
                return "Today";
            } else if (timestampDate >= yesterdayStart) {
                return "Yesterday";
            } else {
                return timestampDate.toISOString().split('T')[0]; 

            }
        }

    return (
        <div className='chat-card__container'>
            <h1 id="chat-card__header">Chat</h1>
            <div className='chatlist__container'>
            {chatList.map((chat, key) => (
                <div 
                    className={chat?.isSeen ? `card__container ${chat?.isSeen}` :  `card__container ${chat?.isSeen}`} 
                    key={key} 
                    data-userid={user.uid} 
                    onClick={() => navigate(`/home/${chat.chatId}`)}>
                    <div className='profile__card'>
                        <img alt='user-avatar' src={chat.photoUrl || Placeholder} />
                        <div className={ chat?.status ? `${chat?.status}` : "status"} ><div className='inner'>
                       
                            </div>
                            </div>
                    </div>
                    <div className='inner-card'>
                    <h1>{chat.displayName}</h1>
                 
                    <div className='details__card'>
             
                        <p>{chat?.lastMessage || "Start sending a message to this user"}
                            </p>
                            <div className='time-bar'>
                            <p>{formatTimestamp(chat?.updatedAt)}</p>
                            </div>
                
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
    );
};

export default ChatList;
