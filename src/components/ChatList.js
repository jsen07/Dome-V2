import React, { useEffect, useState } from 'react'
import { ref, child, get, getDatabase, onValue} from "firebase/database";
import { useStateValue } from './contexts/StateProvider';
import Placeholder from './images/avatar_placeholder.png';
import { useNavigate } from 'react-router-dom';



const ChatList = () => {

    const [chatList, setChatList] = useState();
    const [{user}] = useStateValue();
    const navigate = useNavigate();

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
                const userPromise = get(child(userRef, `users/${childData.recieverId}`));

                chatPromises.push(userPromise.then((userSnapshot) => {
                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        return { 
                            ...childData,
                            ...userData
                        };
                    } else {
                        console.log("No data available for user:", childData.recieverId);
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

    console.log(chatList)

},[user])

const redirectToChat = (e) => {
    const roomid = e.target.getAttribute('data-chatId');
    navigate(`/home/${roomid}`);

}

  return (
    <div className='chat-card__container'>
        <h1 id="chat-card__header"> Chat </h1>

        {chatList && chatList.map((chat, key) => (
            <div className='card__container' key={key} data-chatId={chat.chatId} onClick={redirectToChat}>
                <div className='profile__card'>
                <img alt='user-avatar' src={chat.photoUrl || Placeholder }/>
            </div>
        <div className='details__card'>
            <h1> {chat.displayName} </h1>
            <p> {chat.lastMessage} </p>
            <p> lastMessage </p>
        </div>
    </div>

     ))
    }
        </div>
  )
}

export default ChatList