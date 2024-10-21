import React, { useEffect } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';

const Chat = () => {

    const [{chat}, dispatch] = useStateValue();
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
  return (
    <div className='chat-box__container'>
        <h1> THIS IS WHERE THE USER WILL CHAT</h1>
        <button onClick={conso}>efewfw</button>
    </div>
  )
}

export default Chat