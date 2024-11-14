import React from 'react'
import { useStateValue } from './contexts/StateProvider';



const ChatMessage = ({ data }) => {

    const [{user}, dispatch] = useStateValue();


    function formatTimestamp(timestamp) {
      const date = new Date(timestamp); 
      let options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, 
      };

      let timeString = date.toLocaleString('en-US', options);
      timeString = timeString.replace(/^0/, '');
  
      return timeString;
        
}
  return (
    <div className={data.uid === user?.uid ? "user-message" : "message"}>
        <div className='message_header'>
        <span> {data.displayName}</span>
        <span id="message__time-sent"> {formatTimestamp(data.sentAt)}</span>
        </div>
        <div className='message-box'>
        <p> {data.message} </p>
        {/* <div className='message-time'>
        </div> */}
        </div>
        {/* <span id="message__time-sent"> {formatTimestamp(data.sentAt)}</span> */}
    </div>
  )
}

export default ChatMessage