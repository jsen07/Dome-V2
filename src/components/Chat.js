import React, { useEffect, useState, useRef } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue } from "firebase/database";
import ChatMessage from './ChatMessage';


const Chat = () => {

    const [{user}, dispatch] = useStateValue();
    const [text, setText] =useState();
    const navigate = useNavigate();
    const [reciever, setReciever] = useState();
    const [chat, setChat] = useState([]);
    const [talkingTo, setTalkingTo] = useState();

    const chatMessageRef = useRef();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const { chatId } = useParams();
    useEffect(() =>{

      // const chatD = [];
      const chatRef = ref(getDatabase());
          
      get(child(chatRef, `chat/${chatId}`)).then((snapshot) => {

        const data = snapshot.val();

        if(data){

        const allowedUsersArray = data.allowedUsers
        const index = allowedUsersArray.indexOf(user.uid);
   
          allowedUsersArray.splice(index, 1);
        
        setReciever(allowedUsersArray[0]);

        const messagesArray = Object.values(data.messages || {}).sort((a, b) => {
          return a.serverTime - b.serverTime; // Ascending order
        })

        setChat(messagesArray);
      }


      });



        },[chat]);

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
  
          // Check if the user is scrolled close to the bottom
          const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
          setIsAtBottom(isAtBottom);
      };
  
      useEffect(() => {
          scrollToBottom();
      }, [chat]); // Runs every time the chat array updates
  
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
      }, []); // Set up scroll listener on mount
  

  
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
    <p>No messages</p> // Optional: handle case with no messages
  )}
 
  </div>
  <div ref={messagesEndRef} /></div> 
  <div className='input__container'>
        <input  id="send-message__input" type="text" onChange={handleMessage} />
        <div id="send-button" onClick={sendMessage}></div>
        </div>
  </div>
       
        </div>
  )
}

export default Chat