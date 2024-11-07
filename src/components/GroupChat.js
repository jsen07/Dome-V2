import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useParams } from 'react-router-dom';
import { useStateValue } from './contexts/StateProvider';
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue, update, remove } from "firebase/database";
import ChatMessage from './ChatMessage';
import sendSoundEffect from '../components/sound/sendingSound.mp3';
import receivingSoundEffect from './sound/new-notification-7-210334.mp3';
import { Howl } from 'howler';
import Placeholder from '../components/images/avatar_placeholder.png';
import EmojiPicker from 'emoji-picker-react';

const GroupChat = () => {

  const [ {user} ] = useStateValue();
  const [text, setText] =useState("");
  const [reciever, setReceiver] = useState();
  const [chat, setChat] = useState([]);
  const [seen, setSeen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});


  const messagesEndRef = useRef(null);
  const seenEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { chatId } = useParams();
  const [loading, setLoading] = useState(true);
  const [recieverData, setRecieverData] = useState();
  const [status, setStatus] = useState("Offline");
  const [emojiToggle, setEmojiToggle] = useState(false);
  const [lastMessage, setLastMessage] = useState();
  const [unseenMessages, setUnseenMessages] = useState({});
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  //groupchat variables
  const [groupChat, setGroupChat] =useState();

  var soundSend = new Howl({
    src: [sendSoundEffect]
  });

  var receiveSend = new Howl({
    src: [receivingSoundEffect]
  });
 

  function fetchChatData(chatId, user) {


    return new Promise((resolve, reject) => {
        const chatRef = ref(getDatabase());
        
        get(child(chatRef, `groupChat/${chatId}`)).then((snapshot) => {
                
          const data = snapshot.val();


                if (data) {
                  setGroupChat(data)
                    const allowedUsersArray = [...(data.allowedUsers || [])]; 
                    const index = allowedUsersArray.indexOf(user.uid);
    

                    if (index > -1) {
                        allowedUsersArray.splice(index, 1);
                        setReceiver(allowedUsersArray); 
                    } 
     
                    const messagesArray = Object.values(data.messages || {}).sort((a, b) => a.serverTime - b.serverTime);

                    setChat(messagesArray);





                    resolve({
                        allowedUsers: allowedUsersArray,
                        messages: messagesArray,
                    });
                } else {
                    reject("No data found for the given chatId");
                }

            
            })
            .catch((error) => {
                reject(`Error fetching chat data: ${error.message}`);
            });
    });
}

useEffect(() => {
  setLoading(true); 
  fetchChatData(chatId, user).then(result => {
        setChat(result.messages);

          setLoading(false);

           const chatRef = ref(getDatabase());
          const messagesRef = child(chatRef, `chat/${chatId}/messages`);

  
          const getNewMessage = onValue(messagesRef, (snapshot) => {
               const data = snapshot.val();
              if (data) {
                  const messagesArray = Object.values(data).sort((a, b) => a.serverTime - b.serverTime);
                  if(messagesArray[messagesArray.length-1].chatId === chatId) {
                  setChat(messagesArray);
                  setLastMessage(messagesArray[messagesArray.length-1])
        
                  if (messagesArray.length > result.messages.length) {
                    const newMessage = messagesArray[messagesArray.length - 1];
                    setLastMessage(newMessage)
     
                      if (newMessage.uid !== user.uid && newMessage.chatId === chatId){
                        if(newMessage.type == 'group') {
                          receiveSend.play();
                        }



                      } 
  
                    } 
                  }


               }
               });



          return () => getNewMessage();
      })
      .catch(error => {
          console.log(error);
          setLoading(false);
      });

}, [chatId, user.uid]);




      const sendMessage = () => {

        if(text ===""){
          return
        }

        const chatRef = ref(getDatabase());

        const db = getDatabase();
       
    

const postMessagesRef = ref(db, `chat/${chatId}/messages`);
const newPostRef = push(postMessagesRef);
const uniqueId = newPostRef.key;
set(newPostRef, {

serverTime: serverTimestamp(),
sentAt: serverTimestamp(),
message: text,
displayName: user.displayName,
photoUrl: user.photoURL,
uid: user.uid,
chatId: chatId,
type: 'group'
});

      //   set(child(chatRef, "chatList/"+ reciever +"/"+ user.uid), {

      //     chatId: chatId,
      //     lastMessage: text,
      //     receiverId: user.uid,
      //     updatedAt: serverTimestamp(),
      //     isSeen: false,
      //     id: uniqueId
      
      // });

      // const notificationRef = ref(db, `chatList/${reciever}/notifications/${user.uid}/messages`);
      // const newNotifRef = push(notificationRef);
      // set(newNotifRef, {
      //     message: text,
      //     displayName: user.uid,
      //     sentAt: serverTimestamp(),
      //     isSeen: false,
      //     chatId: chatId,
      //     id: uniqueId,
      // });   
     
      const input = document.getElementById("send-message__input");

      setText("");
      input.value ="";
      notifyTyping(chatId, user.uid, false);
      soundSend.play();




      }

      const scrollToBottom = () => {
        if (messagesEndRef.current) {
            if (!seenEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            } else {
                seenEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
        setIsAtBottom(isAtBottom);
    };

    useEffect(() => {
      const timer = setTimeout(() => {
          scrollToBottom();
      }, 50); 
  
      return () => clearTimeout(timer);
  }, [chat, seen]);


    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }
        
        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []); 

    const handleKeyPress = (event) => {
      if( event.key === "Enter") {
        sendMessage();
      }
  };
const emojiToggleHandler = () => {
  setEmojiToggle(!emojiToggle);
  
}

const handleEmoji =(e)=> {
  setText(prev=>prev+
    e.emoji);
  setEmojiToggle(!emojiToggle);
  inputRef.current.focus();

}

const generateMessages = () => {
  const dateMap = {};

  chat.forEach(chatData => {

    if(chatData.chatId === chatId){
      const timestamp = chatData.sentAt;
     
     
      if (timestamp) {
          const date = new Date(timestamp);
          if (!isNaN(date)) {
              const dateString = date.toISOString().split('T')[0]; // format: YYYY-MM-DD

              const today = new Date().toISOString().split('T')[0]; 
              const now = new Date();
              const todayStart = new Date(now.setHours(0, 0, 0, 0));
              const yesterdayStart = new Date(todayStart);
              yesterdayStart.setDate(yesterdayStart.getDate() - 1);

              // Set the dateMap entry if it doesn't exist
              if (!dateMap[dateString]) {
                  dateMap[dateString] = { label: dateString, messages: [] };
              }

              // Check if the date is today
              if (dateString === today) {
                  dateMap[dateString].label = "Today"; 
              } else if (dateString === yesterdayStart.toISOString().split('T')[0]) {
                  dateMap[dateString].label = "Yesterday";
              }
              dateMap[dateString].messages.push(chatData);
          } else {
              console.error("Invalid date:", timestamp);
          }
      } 
    }
  });

  return Object.keys(dateMap).map(date => (
      <div key={date} className='date-container'>
          <div className='date-notify'>
              <h4>{dateMap[date].label}</h4>
          </div> 
          {dateMap[date].messages.map((message, index) => (
              <ChatMessage key={index} data={message} />
          ))}
      </div>
  ));
};

const notifyTyping = (chatId, userId, typing, displayName) => {
  set(ref(getDatabase(), `typingStatus/${chatId}/${userId}`), typing)
};

const handleInputChange = (e) => {
  setText(e.target.value);

  // Notify typing status for the recipient
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  
  if (!isTyping) {
      setIsTyping(true);
      notifyTyping(chatId, user.uid, true);
  }

  typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      notifyTyping(chatId, user.uid, false);
  }, 1000); 
};
useEffect(() => {
  // Listen for typing status updates in Firebase
  const typingRef = ref(getDatabase(), `typingStatus/${chatId}`);
  const unsubscribe = onValue(typingRef, async (snapshot) => {
    const usersTyping = {};  // To store users who are typing
    
    const typingData = snapshot.val(); // Get the data from Firebase

    if (typingData) {  // Ensure there is data to iterate over
      // Iterate over the keys of the typing data object
      for (const userId in typingData) {
        if (typingData[userId]) {  // If the user is typing (true)
          // Only process if the user is in the reciever list
          if (reciever && reciever.includes(userId)) {
            try {
              const displayName = await getUserDisplayName(userId);
              if (displayName) {
                usersTyping[userId] = displayName;  // Add user to typing list with their displayName
              }
            } catch (error) {
              console.error("Error fetching displayName for user:", userId, error);
            }
          }
        }
      }
    }

    // Update the typing users state
    setTypingUsers(usersTyping);
    console.log("Users typing:", usersTyping);  // Log for debugging
  });

  return () => unsubscribe();  // Cleanup the listener when the component unmounts
}, [chatId, reciever]);  // Dependencies: chatId and reciever



const getUserDisplayName = async (userId) => {
  const db = getDatabase();
  const userRef = ref(db, `users/${userId}`);
  
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val().displayName; // Return displayName of the user
    } 
  } catch (error) {
    console.error("Error fetching user displayName:", error);
    return null; // Handle error or return a default value
  }
};


    return (
      <div className='chat-box__container'>
      {/* <button onClick={closeChat}> Close Chat</button> */}
<div className='chat__header'>
{ loading ?  (
  <h1></h1>

) : (
  <div className='chat__banner'>
      <div className='profile__card'>
                <img alt='user-avatar' src={ groupChat?.photoUrl || Placeholder} />

            </div>
            <div className='header-details'>
            <h1> {groupChat?.name}</h1>
            <p> {groupChat?.allowedUsers.length} members </p>
       
            </div>
  </div>
)}


<div className='messages__container'ref={messagesContainerRef}>

<div className='messages__inner'>

{generateMessages()}

<div className='seen__container'>
{Object.keys(typingUsers).length > 0 && Object.keys(typingUsers).map((userId, index) => {
  return (
    <p id="typing" key={index}>
      {typingUsers[userId]} is typing...
    </p>
  );
})}



                      
{ seen && Object.keys(typingUsers).length === 0 && ( <span ref={seenEndRef}> Seen </span>)}
</div>

{chat.length === 0 && <p>No messages</p>}

</div>
<div ref={messagesEndRef} /></div> 
<div className='input__container'>
<div className='emoji-button' onClick={emojiToggleHandler}> </div>
<div className='emoji-picker__container'>
<EmojiPicker open={emojiToggle} emojiStyle="native" onEmojiClick={handleEmoji} theme="dark" height={400} width={400}/>
</div>
<input  id="send-message__input" type="text" placeholder="Type a message..."  ref={inputRef} value={text} onChange={handleInputChange} onKeyDown={handleKeyPress} />
<div id="send-button" onClick={sendMessage}></div>
</div>
</div>

</div>



    )
  }
  
  export default GroupChat