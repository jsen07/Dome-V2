import React, { useEffect, useState, useRef } from 'react'
import { ref, child, get, getDatabase, onValue} from "firebase/database";
import { useStateValue } from './contexts/StateProvider';
import Placeholder from './images/avatar_placeholder.png';
import { useNavigate } from 'react-router-dom';
import Chat from './Chat';



const ChatList = () => {

    const [chatList, setChatList] = useState();
    const [{user}] = useStateValue();
    const [chatToggle, setChatToggle] = useState();
    const navigate = useNavigate();   
    const chatRef = useRef();

useEffect(() => {

    const dbRef = ref(getDatabase(), 'chatList/' + user.uid);
    let allChat = []; // Initialize outside the callback

    const fetchChats = async () => {
        allChat = []; 

        const chatPromises = [];
        const userRef = ref(getDatabase());

        onValue(dbRef, async (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const childData = childSnapshot.val();
                // console.log(childData)
                const userPromise = get(child(userRef, `users/${childData.receiverId}`));

                chatPromises.push(userPromise.then((userSnapshot) => {
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        return { 
                            ...childData,
                            ...userData
                        };
                    } else {
                        console.log("No data available for user:", childData.receiverId);
                        return null; // Return null if no data
                    }
                }));
            });

            try {
                const chatObjects = await Promise.all(chatPromises);
                allChat = chatObjects.filter(chat => chat !== null); // Filter out null values
                setChatList(allChat.sort((a, b) => b.updatedAt - a.updatedAt));
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        }, {
            onlyOnce: true
        });
    };

    fetchChats();

},[user.uid])

  return (
    <div className='chat-card__container'>
        <h1 id="chat-card__header"> Chat </h1>

        {chatList && chatList.map((chat, key) => (
            <div className='card__container' key={key} data-userid={user.uid} onClick={() => {navigate(`/home/${chat.chatId}`)}
            }>
                <div className='profile__card'>
                <img alt='user-avatar' src={chat.photoUrl || Placeholder }/>
            </div>
        <div className='details__card'>
            <h1> {chat.displayName} </h1>
            <p> {chat?.lastMessage || "start sending a message to this user"} </p>
        </div>
    </div>

    

     ))
    }

        </div>
  )
}

export default ChatList