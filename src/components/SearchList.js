import React, { useState } from 'react';
import Placeholder from '../components/images/avatar_placeholder.png';
import { useStateValue } from './contexts/StateProvider';
import { getDatabase, ref, child, get, set, push, serverTimestamp } from "firebase/database";
import { useNavigate } from "react-router-dom";

const SearchList = ({ results, key }) => {
    const [view, setView] = useState(false);
    const [{ user }] = useStateValue();
    const navigate = useNavigate();

    const viewToggle = () => {
        setView(!view);
    };

    const createChat = async () => {
        const db = getDatabase();
        const chatId = generateChatId(user.uid, results.uid);
        

        try {
            const chatSnapshot = await get(child(ref(db), `chat/${chatId}`));
            const chatListRef = ref(db, 'chatList');
            const newChatListRef = push(chatListRef);
            const chatListId = newChatListRef.key;

            const userNotificationKey = push(ref(db, `chatList/${user.uid}/notifications`)).key
            const recieverNotificationKey = push(ref(db, `chatList/${results.uid}/notifications`)).key

            // Check if chat already exists
            if (!chatSnapshot.exists()) {
                const chatData = {
                    createdAt: serverTimestamp(),
                    messages: {},
                    allowedUsers: [user.uid, results.uid]
                };

          //create a new chat if a chat doesnt exist
         await set(ref(db, `chat/${chatId}`), chatData);

                // Update chat lists for both users
                    await Promise.all([
                    set(child(ref(db), `chatList/${results.uid}/${user.uid}`), {
                        chatId: chatId,
                        displayName: user.displayName,
                        lastMessage: "",
                        receiverId: user.uid,
                        updatedAt: serverTimestamp(),
                        isSeen: false,
                        id: chatListId
                    }),
                    set(child(ref(db), `chatList/${user.uid}/${results.uid}`), {
                        chatId: chatId,
                        displayName: results.displayName,
                        lastMessage: "",
                        receiverId: results.uid,
                        updatedAt: serverTimestamp(),
                        isSeen: false,
                        id: chatListId
                    }),

                    //set notification 
                    set(child(ref(db), `chatList/${user.uid}/notifications/${results.uid}`),
                     {
                        messages: {}
                    }),
                    set(child(ref(db), `chatList/${results.uid}/notifications/${user.uid}`),
                     {
                        messages: {}
                    })
                ]);

                // navigate to the new chat
                console.log("Chat created successfully!");
                navigate(`/home/${chatId}`);
            } else {
                console.log("Chat already exists.");
                navigate(`/home/${chatId}`);
     
            }
        } catch (error) {
            console.error("Error creating chat:", error);
            alert("Failed to create chat. Please try again.");
        }
    };

    //function to generate a new chatId using our user and the opposite user
    const generateChatId = (userId1, userId2) => {
        return [userId1, userId2].sort().join('_'); // Unique id based on user ids
    };

    return (
        <div className='searched-user__container'>
            {!view ? (
                <div className='searched-user__box'>
                    <div className='searched-user__profile'>
                        <img src={results.photoUrl || Placeholder} alt="User Avatar" />
                    </div>
                    <div className='searched-user__view'>
                        <div className='searched-dp'>          
                            <p>{results.displayName}</p>
                        </div>
                        <div className='searched-view'>
                            <div id="view-user" onClick={viewToggle}></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='searched-user__view'>
                    <h1>{results.displayName}</h1>
                    <div className='profile-view__container'>
                        <div className='view-user__profile' key={key}>
                            <img src={results.photoUrl || Placeholder} alt="User Avatar" />
                        </div>

                        <div className='view-user__details'>
                        <p>Display Name: {results.displayName}</p>
                        <p>Bio: {results.Bio}</p>
                        <p>Gender: {results.Gender}</p>
                        </div>
                        <div className='search-buttons__container'>
                        <button onClick={createChat}>Message</button>
                        <button onClick={viewToggle}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchList;