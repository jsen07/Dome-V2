import React, { useEffect, useState } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue } from "firebase/database";

const Chat = () => {

    const [{user}, dispatch] = useStateValue();
    const [text, setText] =useState();
    const navigate = useNavigate();

    const { chatId } = useParams();
    useEffect(() =>{



        },[]);

        const sendMessage = () => {
          // const dbRef = ref(getDatabase())

          // const date = new Date();
          // const timeString = date.toLocaleTimeString(navigator.language, {
          //   hour: "2-digit",
          //   minute: "2-digit",
          // });

          // set(child(dbRef, "chat/"+ chatId+"/messages"), {
          //   serverTime: serverTimestamp(),
          //   sentAt: timeString,
          //   message: text,
          //   displayName: user.displayName,
          //   photoUrl: user.photoUrl,
          // });






 
        }

        // const closeChat = () => {
        //   navigate("/home");
        // }

        const handleMessage = (event) => {
          setText(event.target.value)

        }
  return (
    <div className='chat-box__container'>
              {/* <button onClick={closeChat}> Close Chat</button> */}
        <h1> THIS IS the { chatId }</h1>

        <input  id="send-message__input" type="text" onChange={handleMessage} />
        <button onClick={sendMessage}>efewfw</button>
    </div>
  )
}

export default Chat