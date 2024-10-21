import React, { useEffect, useState } from 'react'
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue} from "firebase/database";
import { db } from '../firebase';
import { useStateValue } from './contexts/StateProvider';
import Placeholder from './images/avatar_placeholder.png';



const ChatList = () => {

    const [chatList, setChatList] = useState();
    const [{user}, dispatch] = useStateValue();
    const [loading, setLoading]=useState(true);

useEffect(() => {

    const dbRef = ref(getDatabase(), 'chatList/' + user.uid);
    let allChat = []; // Initialize outside the callback

    const fetchChats = async () => {
        allChat = []; // Clear previous chats

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

},[user])


  return (
    <div className='chat-card__container'>

        {chatList && chatList.map((chat, key) => (
            <div className='card__container' key={key}>
                <div className='profile__card'>
                <img src={chat.photoUrl || Placeholder }/>
            </div>
        <div className='details__card'>
            <h1> {chat.displayName} </h1>
            {/* <p> {chat.lastMessage} </p> */}
            <p> lastMessage </p>
        </div>
    </div>

     ))
    }
        </div>
  )
}

export default ChatList