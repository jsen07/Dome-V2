import React, { useEffect, useState, useRef } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue } from "firebase/database";
import ChatMessage from './ChatMessage';
import sendSoundEffect from '../components/sound/sendingSound.mp3';
import receivingSoundEffect from '../components/sound/receivingSound.mp3';


const Chat = () => {

    const [{user}, dispatch] = useStateValue();
    const [text, setText] =useState();
    const navigate = useNavigate();
    const [reciever, setReceiver] = useState();
    const [chat, setChat] = useState([]);
    const [talkingTo, setTalkingTo] = useState();

    const chatMessageRef = useRef();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const { chatId } = useParams();

    const sendSound = new Audio(sendSoundEffect);
    const receivingSound = new Audio(receivingSoundEffect);


    useEffect(() => {
      const chatRef = ref(getDatabase());

      //Create an async function or promise to run and fetch the chat data as well as the reciever

      const fetchChatData = async () => {

        try {
      await get(child(chatRef, `chat/${chatId}`)).then((snapshot) => {
          const data = snapshot.val();
          if (data) {
           const allowedUsersArray = data.allowedUsers;
           const index = allowedUsersArray.indexOf(user.uid);
              allowedUsersArray.splice(index, 1);
              setReceiver(allowedUsersArray[0]);
              const messagesArray = Object.values(data.messages || {}).sort((a, b) => a.serverTime - b.serverTime);
              setChat(messagesArray);
          }
      });
    } catch (error) {
      console.log(error);
    }
    }

    fetchChatData();
// listener for new chat messages
  const messagesRef = child(chatRef, `chat/${chatId}/messages`);
      onValue(messagesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
      const messagesArray = Object.values(data).sort((a, b) => a.serverTime - b.serverTime);
      //check for new messages
      if(messagesArray.length > chat.length) {
        const newMessage = messagesArray[messagesArray.length - 1];
        // console.log(newMessage)
        if(newMessage.uid !== user.uid) {
          receivingSound.play()
        }
      }

          setChat(messagesArray);

          }
      });

  },[chatId, user.uid]);


        const sendMessage = () => {

          if(text ===""){
            return
          }
          const chatRef = ref(getDatabase());

          const db = getDatabase();


console.log(reciever)
          const date = new Date();
          const timeString = date.toLocaleTimeString(navigator.language, {
            hour: "2-digit",
            minute: "2-digit",
          });
const postMessagesRef = ref(db, `chat/${chatId}/messages`);
const newPostRef = push(postMessagesRef);
set(newPostRef, {

  serverTime: serverTimestamp(),
  sentAt: timeString,
  message: text,
  displayName: user.displayName,
  photoUrl: user.photoURL,
  uid: user.uid
    // ...
});

          set(child(chatRef, "chatList/"+ reciever +"/"+ user.uid), {
 
            chatId: chatId,
            lastMessage: text,
            receiverId: user.uid,
            updatedAt: serverTimestamp()
        
        });
       
        const input = document.getElementById("send-message__input");

        setText("");
        input.value ="";
        sendSound.play();
        scrollToBottom();



 
        }

        const handleMessage = (event) => {
          setText(event.target.value)

        }
        const scrollToBottom = () => {
          if (isAtBottom) {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
      };
  
      const handleScroll = () => {
          const container = messagesContainerRef.current;
          if (!container) return;
          const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
          setIsAtBottom(isAtBottom);
      };
  
      useEffect(() => {
          scrollToBottom();
      }, [chat]); 
  
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
  
  return (
    <div className='chat-box__container'>
              {/* <button onClick={closeChat}> Close Chat</button> */}
        <div className='chat__header'>

        <div className='messages__container'ref={messagesContainerRef}>

        <div className='messages__inner'>

        {chat && chat.length > 0 ? (
    chat.map((chatData, index) => (
      <ChatMessage key={index} data={chatData} />
    ))
  ) : (
    <p>No messages</p>
  )}
 
  </div>
  <div ref={messagesEndRef} /></div> 
  <div className='input__container'>
        <input  id="send-message__input" type="text" onChange={handleMessage} onKeyDown={handleKeyPress} />
        <div id="send-button" onClick={sendMessage}></div>
        </div>
  </div>
       
        </div>
  )
}

export default Chat