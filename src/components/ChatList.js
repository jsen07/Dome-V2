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

        const statusRef = ref(getDatabase(), `chatList/${user.uid}`);

    }, [user.uid]); 
    return (
        <div className='chat-card__container'>
            <h1 id="chat-card__header">Chat</h1>
            {chatList.map((chat, key) => (
                <div 
                    className='card__container' 
                    key={key} 
                    data-userid={user.uid} 
                    onClick={() => navigate(`/home/${chat.chatId}`)}>
                    <div className='profile__card'>
                        <img alt='user-avatar' src={chat.photoUrl || Placeholder} />
                    </div>
                    <div className='details__card'>
                        <h1>{chat.displayName}</h1>
                        <p>{chat.lastMessage || "Start sending a message to this user"}
                            <p>{chat.status}</p>
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatList;
