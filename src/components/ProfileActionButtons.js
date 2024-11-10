import React, { useEffect, useState } from 'react'
import { useAuth } from './contexts/AuthContext';
import { ref, set, child, get, getDatabase, onValue, serverTimestamp, push } from 'firebase/database';
import { useStateValue } from './contexts/StateProvider';
import { useNavigate } from 'react-router-dom';

const ProfileActionButtons = ({ userDetails }) => {

const [{ user }] = useStateValue();
const { currentUser } = useAuth()
const navigate = useNavigate();
const [hasSent, setHasSent] = useState(false);
const [isFriends, setIsFriends] = useState(false);

const createChat = async () => {
    const db = getDatabase();
    const chatId = generateChatId(user.uid, userDetails.uid);
    

    try {
        const chatSnapshot = await get(child(ref(db), `chat/${chatId}`));
        const chatListRef = ref(db, 'chatList');
        const newChatListRef = push(chatListRef);
        const chatListId = newChatListRef.key;

        const userNotificationKey = push(ref(db, `chatList/${currentUser.uid}/notifications`)).key
        const recieverNotificationKey = push(ref(db, `chatList/${userDetails.uid}/notifications`)).key

        // Check if chat already exists
        if (!chatSnapshot.exists()) {
            const chatData = {
                createdAt: serverTimestamp(),
                messages: {},
                allowedUsers: [user.uid, userDetails.uid]
            };

      //create a new chat if a chat doesnt exist
     await set(ref(db, `chat/${chatId}`), chatData);

            // Update chat lists for both users
                await Promise.all([
                set(child(ref(db), `chatList/${userDetails.uid}/${currentUser.uid}`), {
                    chatId: chatId,
                    displayName: user.displayName,
                    lastMessage: "",
                    receiverId: user.uid,
                    updatedAt: serverTimestamp(),
                    isSeen: false,
                    id: chatListId
                }),
                set(child(ref(db), `chatList/${currentUser.uid}/${userDetails.uid}`), {
                    chatId: chatId,
                    displayName: userDetails.displayName,
                    lastMessage: "",
                    receiverId: userDetails.uid,
                    updatedAt: serverTimestamp(),
                    isSeen: false,
                    id: chatListId
                }),
                //set notification 
                set(child(ref(db), `chatList/${currentUser.uid}/notifications/${userDetails.uid}`),
                 {
                    messages: {}
                }),
                set(child(ref(db), `chatList/${userDetails.uid}/notifications/${currentUser.uid}`),
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


const generateChatId = (userId1, userId2) => {
    return [userId1, userId2].sort().join('_');
}

    const handleFriendRequest = async ()=> {
        if(!user) return
  
        const friendRequest = {
            displayName: currentUser.displayName,
            uid: currentUser.uid,
            photoUrl: currentUser.photoURL,
            timestamp: serverTimestamp(),
        }
        try {
            const friendRequestRef = ref(getDatabase(), `friendRequests/${userDetails?.uid}`);
            const newFriendRequestRef = push(friendRequestRef);
            
            await set(newFriendRequestRef, friendRequest);
            setHasSent(true);
    
        }
        catch (error) {
            console.log(error)
        }
      }

const getFriendRequests = async () => {
        if(currentUser.uid === userDetails?.uid) {
            return
        }
        try {
            const friendRequestRef = ref(getDatabase());
            const snapshot = await get(child(friendRequestRef, `friendRequests/${userDetails?.uid}`))

            const data = snapshot.val();
            if(data) {
            const requestsArray = Object.values(data);
            const hasSentRequest = requestsArray.some((request) => request.uid === currentUser.uid);
            setHasSent(hasSentRequest);
            } else {
                setHasSent(false)
            }
        }
        catch (error) {
            console.log(error)
        }       
}

const friendsCheck = async () => {
    try {
      const friendsRef = ref(getDatabase());
      const snapshot = await get(child(friendsRef, `friendsList/${userDetails?.uid}/${currentUser.uid}`));
      
      if (snapshot.exists()) {
        setIsFriends(true);
        return true;
      } else {
        setIsFriends(false);
        return false; 
      }
    } catch (error) {
      console.error("Error checking friendship status:", error);
    }
  };
  useEffect(() => {
    if (!currentUser || !userDetails) return;
    const checkFriends = async () => {
      try {
        const isFriends = await friendsCheck();
        
        if (!isFriends) {
          await getFriendRequests(); 
        }
      } catch (error) {
        console.error("Error in checking friendship:", error);
      }
    };

    checkFriends();
  }, [currentUser, userDetails]);

  return (
<div>
  <button onClick={createChat}>Message</button>

  {isFriends ? (
    <h3>Friends ✅</h3>
  ) : (
    <>

      {hasSent ? (
        <p>Friend request has been sent.</p>
      ) : (
        <button onClick={handleFriendRequest}>Send friend request</button>
      )}
    </>
  )}
</div>
  )
}

export default ProfileActionButtons
