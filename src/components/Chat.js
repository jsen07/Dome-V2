import React, { useEffect } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const Chat = () => {

    const [{chat}, dispatch] = useStateValue();
    const navigate = useNavigate();

    const { chatId } = useParams();
    useEffect(() =>{

        },[]);

        const conso = () => {
            // const chat = {
            //     chatId: 123,
            //     chatName: "hello"
            // }
            // dispatch({
            //     type: actionTypes.SET_CHAT,
            //     chat: chat  
            //   })

              console.log(chat)
        }

        const closeChat = () => {
          navigate("/home");
        }
  return (
    <div className='chat-box__container'>
        <h1> THIS IS the { chatId }</h1>
        <button onClick={conso}>efewfw</button>
        <button onClick={closeChat}> Close Chat</button>
    </div>
  )
}

export default Chat