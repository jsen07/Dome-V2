import React from 'react'
import { useStateValue } from './contexts/StateProvider';



const ChatMessage = ({ data }) => {

    const [{user}, dispatch] = useStateValue();

  return (
    <div className={data.uid === user?.uid ? "user-message" : "message"}>
        <div className='message_header'>
        <span> {data.displayName}</span>
        <span id="message__time-sent"> {data.sentAt}</span>
        </div>
        <div className='message-box'>
        <p> {data.message} </p>
        {/* <div className='message-time'>
        </div> */}
        </div>
    </div>
  )
}

export default ChatMessage