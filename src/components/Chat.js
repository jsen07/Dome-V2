import React, { useEffect, useState, useRef } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue } from "firebase/database";
import ChatMessage from './ChatMessage';
import sendSoundEffect from '../components/sound/sendingSound.mp3';
import receivingSoundEffect from '../components/sound/receivingSound.mp3';
import {Howl, Howler} from 'howler';


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
    const [loading, setLoading] = useState(true);

    const sendSound = new Audio(sendSoundEffect);
    const receivingSound = new Audio(receivingSoundEffect);

    var soundSend = new Howl({
      src: [sendSoundEffect]
    });

    var receiveSend = new Howl({
      src: [receivingSoundEffect]
    });

//create a promise to ensure that chatdata is fetched 
    function fetchChatData(chatId, user) {


      return new Promise((resolve, reject) => {
          const chatRef = ref(getDatabase());
          
          get(child(chatRef, `chat/${chatId}`)).then((snapshot) => {
                  
            const data = snapshot.val();
  

                  if (data) {
                      const allowedUsersArray = [...(data.allowedUsers || [])]; // 
                      const index = allowedUsersArray.indexOf(user.uid);
  
                      if (index > -1) {
                          allowedUsersArray.splice(index, 1);
                          setReceiver(allowedUsersArray[0]); 
                      } else {
                        setReceiver(null); 
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
//fetch chat data everytime user changes chat
    fetchChatData(chatId, user).then(result => {
          setChat(result.messages);
            setLoading(false);

             const chatRef = ref(getDatabase());
            const messagesRef = child(chatRef, `chat/${chatId}/messages`);

            //listen for new messages and update chat

            const getNewMessage = onValue(messagesRef, (snapshot) => {
                 const data = snapshot.val();
                if (data) {
                    const messagesArray = Object.values(data).sort((a, b) => a.serverTime - b.serverTime);
                    setChat(messagesArray);

                    // Check for new messages
                    if (messagesArray.length > result.messages.length) {
                      const newMessage = messagesArray[messagesArray.length - 1];
                        if (newMessage.uid !== user.uid && newMessage.chatId === chatId) {
                            console.log("New message detected:", newMessage);
                            receiveSend.play();
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

  
 
  
 
 
// listener for new chat messages
  // const messagesRef = child(chatRef, `chat/${chatId}/messages`);
  //     const cleanUp = onValue(messagesRef, (snapshot) => {
  //         const data = snapshot.val();
  //         if (data) {
  //     const messagesArray = Object.values(data).sort((a, b) => a.serverTime - b.serverTime);
  //     //check for new messages

  //     if(messagesArray.length > chat.length) {
  //       const newMessage = messagesArray[messagesArray.length - 1];
  //       // console.log(newMessage)
  //       if(newMessage.uid !== user.uid && newMessage.chatId === chatId) {
  //             console.log(chat.length)
  //     console.log(messagesArray.length)
  //         receiveSend.play();
  //         // console.log(newMessage)
  //         setChat(messagesArray);
  //       }
  //     }

        
    

  //         }
  //     });

  //     return () => {
  //       cleanUp(); 
  //   };



  // useEffect(() => {
  //   const chatRef = ref(getDatabase());

  //   const messagesRef = child(chatRef, `chat/${chatId}/messages`);
  //     const cleanUp = onValue(messagesRef, (snapshot) => {
  //         const data = snapshot.val();
  //         if (data) {
  //     const messagesArray = Object.values(data).sort((a, b) => a.serverTime - b.serverTime);
  //     //check for new messages
  //     setChat(messagesArray)

  //     if(!loading && messagesArray.length > chat.length) {
  //       const newMessage = messagesArray[messagesArray.length - 1];
  //       // console.log(messagesArray.length)
  //       // console.log(chat.length)
  //       if(newMessage.uid !== user.uid) {
  //             console.log(chat.length)
  //     console.log(messagesArray.length)
  //         receiveSend.play();
  //         // console.log(newMessage)
  //         setChat(messagesArray);
  //       }
  //     }

        
    

  //         }
  //     });

  //     return () => {
  //       cleanUp(); 
  //   };


  // },[])



        const sendMessage = () => {

          if(text ===""){
            return
          }
          const chatRef = ref(getDatabase());

          const db = getDatabase();


// console.log(reciever)

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
  });
};

const currentTimestamp = Date.now();
const timeString = formatTimestamp(currentTimestamp);
         
      

const postMessagesRef = ref(db, `chat/${chatId}/messages`);
const newPostRef = push(postMessagesRef);
set(newPostRef, {

  serverTime: serverTimestamp(),
  sentAt: timeString,
  message: text,
  displayName: user.displayName,
  photoUrl: user.photoURL,
  uid: user.uid,
  chatId: chatId
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
        soundSend.play();
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
        { loading ?  (
          <h1> LOADING</h1>
        ) : (
          <h1> finished loading </h1>
        )}


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