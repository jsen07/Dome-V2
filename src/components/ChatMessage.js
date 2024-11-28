import React from 'react'
import { useStateValue } from './contexts/StateProvider';



const ChatMessage = ({ data, isFirstMessageOfDay, shouldShowDisplayName }) => {

    const [{user}, dispatch] = useStateValue();


    function formatTimestamp(timestamp) {
      const date = new Date(timestamp); 
      let hours = date.getHours();       // Get hours
      const minutes = date.getMinutes()
      let dayOrNight = "";

    if(hours >= 12) {
        dayOrNight = "PM"
    }
    if(hours === 0 || hours < 12) {
        dayOrNight ="AM"
    }
    if( hours === 0 ) {
        hours = 12;
    }

      const timeOfMessage = `${hours}:${String(minutes).padStart(2, '0')} ${dayOrNight}`;

  
      return timeOfMessage;
        
}

function HeaderformatTimestamp(timestamp) {
  const timestampDate = new Date(timestamp);
  let hours = timestampDate.getHours();       // Get hours
  const minutes = timestampDate.getMinutes()
  let dayOrNight = "";
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const currentDay = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));
  const dayOfWeek = timestampDate.toLocaleString('en-US', { weekday: 'long' });

  if(hours >= 12) {
      dayOrNight = "PM"
  }
  if(hours === 0 || hours < 12) {
      dayOrNight ="AM"
  }
  if( hours === 0 ) {
      hours = 12;
  }

  const timeOfMessage = `${hours}:${String(minutes).padStart(2, '0')} ${dayOrNight}`;
  if (timestampDate >= todayStart) {
      
      
      return `${timeOfMessage}`;

  } else if (timestampDate >= yesterdayStart) {
      return `Yesterday at ${timeOfMessage}`;
  } else if (timestampDate >= startOfWeek && timestampDate <= todayStart) {
  
      return `${dayOfWeek} at ${timeOfMessage}`
  } else {
      return `${dayOfWeek}, ${timestampDate.toLocaleDateString("en-US", { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
      })} at ${timeOfMessage}`
      }
  }

  return (
<>
{/* {shouldShowDisplayName && (
  <span id="time-header"> {HeaderformatTimestamp(data.sentAt)}</span>
)} */}
<div className='message__container'>

        <div className='message-box'>
        <p> {data.message} </p>

        {/* <span id="message__time-sent"> {formatTimestamp(data.sentAt)}</span> */}
    </div>
    {!isFirstMessageOfDay && !shouldShowDisplayName ? (
    <span id="message__time-sent">{formatTimestamp(data.sentAt)}</span>
  ) : (
    <span id="message__time-sent"></span>
  )
}


</div>
</>
  )
}

export default ChatMessage