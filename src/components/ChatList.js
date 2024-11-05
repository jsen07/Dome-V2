import React, { useEffect, useState } from 'react';
import { ref, child, get, getDatabase, onValue } from "firebase/database";
import { useStateValue } from './contexts/StateProvider';
import Placeholder from './images/avatar_placeholder.png';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from './contexts/AuthContext';

const ChatList = () => {

    
    const [chatList, setChatList] = useState([]);
    const [AllChatList, setAllChatList] = useState([]);
    const [{ user }] = useStateValue();
    const navigate = useNavigate();
    const [onlineUsersCount, setOnlineUsersCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState(new Set()); // Track online users
    const [filter, setFilter] = useState('chatList');
    const [onlineUserList,  setOnlineUserList] = useState([]);
    const [notificationList,  setNotificationList] = useState([]);
    const [onlineToggle, setOnlineToggle] = useState(false);
    const [notificationToggle, setNotificationToggle] = useState(false);
    const [allToggle, setAllToggle] = useState(false);
    const [typingStatus, setTypingStatus] = useState({});

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
                    const notificationsPromise = get(child(ref(getDatabase()), `chatList/${user.uid}/notifications/${childData.receiverId}`));

                    chatPromises.push(Promise.all([userPromise, statusPromise, notificationsPromise]).then(([userSnapshot, statusSnapshot, notificationsSnapshot]) => {
                        if (userSnapshot.exists()) {
                            const userData = userSnapshot.val();
                            const status = statusSnapshot.val();
                            const notifications = notificationsSnapshot.exists() ? notificationsSnapshot.val() : {};
                            const { messages = {} } = notifications;
                            return {
                                ...childData,
                                ...userData,
                                status,
                                messages
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
                    setAllChatList(filteredChats.sort((a, b) => b.updatedAt - a.updatedAt))
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            });
        };

        fetchChats();
    }, [user, onlineUsers]); 

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
    const typingRef = ref(getDatabase(), `typingStatus`);

    const unsubscribe = onValue(typingRef, (snapshot) => {
        const typingData = {};
        snapshot.forEach((childSnapshot) => {
            const chatId = childSnapshot.key;
            childSnapshot.forEach((userSnapshot) => {
                const userId = userSnapshot.key;
                const isTyping = userSnapshot.val();
                if (isTyping) {
                    typingData[chatId] = typingData[chatId] || [];
                    typingData[chatId].push(userId);
                }
            });
        });
        setTypingStatus(typingData);
    });

    return () => unsubscribe();
}, []);

        useEffect(() => {
            if(!onlineToggle && !notificationToggle) {
                setAllToggle(true);
            }
        })
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
    
            return () => unsubscribe();
        }, [user.uid]);

        useEffect(() => {
            if (!currentUser) return;
    
            const db = getDatabase();
            const statusRef = ref(db, 'status');
            
            const unsubscribe = onValue(statusRef, (snapshot) => {
                const onlineUsersTemp = new Set();
                snapshot.forEach((childSnapshot) => {
                    const userId = childSnapshot.key;
                    const userStatus = childSnapshot.val();
                    if (userStatus === 'Online' && userId !== currentUser.uid) {
                        onlineUsersTemp.add(userId); 
                    }
                });
                setOnlineUsers(onlineUsersTemp);
                setOnlineUsersCount(onlineUsersTemp.size);
            });
    
            return () => unsubscribe(); 
        }, [currentUser]);



    // get onlnie users
    useEffect(() => {
        const onlineChats = AllChatList.filter(chat => onlineUsers.has(chat.receiverId));
        setOnlineUserList(onlineUsers.size > 0 ? onlineChats : AllChatList)
    }, [onlineUsers, chatList]);

    const handleOnlineFilter = () => {
        setNotificationToggle(false);
        // const onlineChats = AllChatList.filter(chat => onlineUsers.has(chat.receiverId));
        // setChatList(onlineChats);
        setOnlineToggle(true);


        
        const onlineChats = AllChatList.filter(chat => onlineUsers.has(chat.receiverId));
        setOnlineUserList(onlineUsers.size > 0 ? onlineChats : AllChatList)

    };
    const handleAllFilter = () => {
        setOnlineToggle(false);
        setNotificationToggle(false);

    }

    useEffect(() => {
        const chatsWithNotifications = AllChatList.filter(chat => 
            chat.messages && Object.keys(chat.messages).length > 0
        );
        setNotificationList(chatsWithNotifications);
    }, [AllChatList]);

    const handleNotificationsFilter = () => {
        setOnlineToggle(false);
        setNotificationToggle(true);
        const chatsWithNotifications = AllChatList.filter(chat => 
            chat.messages && Object.keys(chat.messages).length > 0
        );
        setNotificationList(chatsWithNotifications);
    };



          function formatTimestamp(timestamp) {
            const timestampDate = new Date(timestamp);
            const hours = timestampDate.getHours();       // Get hours
            const minutes = timestampDate.getMinutes()
            const timeOfMessage = `${hours}:${String(minutes).padStart(2, '0')}`;
            const now = new Date();
        
            // Start of today and yesterday
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        
            if (timestampDate >= todayStart) {
         
                return "Today";
                // return timeOfMessage;
            } else if (timestampDate >= yesterdayStart) {
                return "Yesterday";
            } else {
                return timestampDate.toISOString().split('T')[0]; 

            }
        }

    return (
        <div className='chat-card__container'>
<h1> Messages </h1>
            {/* <p> Online {onlineUsersCount}</p> */}
            <p onClick={handleAllFilter}>All</p>
            {onlineUsersCount > 0 &&  <p onClick={handleOnlineFilter}>Online</p>}
            {notificationList.length > 0 && <p onClick={handleNotificationsFilter} style={{ cursor: 'pointer' }}> Unread</p>}
     
            
            {!onlineToggle && !notificationToggle && (
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
                        {typingStatus[chat.chatId]?.filter(userId => userId !== currentUser.uid).length > 0 ? (
  <p className="typing-indicator">is typing...</p>
) : (
  <p>{chat?.lastMessage || "Start sending a message to this user"}</p>
)}
                                <div className='time-bar'>
                                {Object.keys(chat?.messages).length > 0  && <p>{Object.keys(chat?.messages).length }</p>}
                                <p>{formatTimestamp(chat?.updatedAt)}</p>
                                </div>
                    
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}

            {onlineToggle && (
                <div className='chatlist__container'>
                {onlineUserList.map((chat, key) => (
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
                                {Object.keys(chat?.messages).length > 0  && <p>{Object.keys(chat?.messages).length }</p>}
                                <p>{formatTimestamp(chat?.updatedAt)}</p>
                                </div>
                    
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}

            
{notificationToggle && (
                <div className='chatlist__container'>
                    
                {notificationList.map((chat, key) => (
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
                                {Object.keys(chat?.messages).length > 0  && <p>{Object.keys(chat?.messages).length }</p>}
                                <p>{formatTimestamp(chat?.updatedAt)}</p>
                                </div>
                    
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
  
        </div>
    );
};

export default ChatList;

