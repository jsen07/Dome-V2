import React, { useEffect, useState, useRef } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { actionTypes } from '../reducers/userReducer';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue, update } from "firebase/database";
import ChatMessage from './ChatMessage';
import sendSoundEffect from '../components/sound/sendingSound.mp3';
import receivingSoundEffect from '../components/sound/receivingSound.mp3';
import {Howl, Howler} from 'howler';
import Placeholder from '../components/images/avatar_placeholder.png';
import EmojiPicker from 'emoji-picker-react';

//ewfwe
const Chat = () => {

    const [{user}, dispatch] = useStateValue();
    const [text, setText] =useState("");
    const navigate = useNavigate();
    const [reciever, setReceiver] = useState();
    const [chat, setChat] = useState([]);
    const [seen, setSeen] = useState(false);

    const chatMessageRef = useRef();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const { chatId } = useParams();
    const [loading, setLoading] = useState(true);
    const [recieverData, setRecieverData] = useState();
    const [status, setStatus] = useState("Offline");
    const [emojiToggle, setEmojiToggle] = useState(false);
    const [lastMessage, setLastMessage] = useState();

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
                      // console.log(data)
  
                      if (index > -1) {
                          allowedUsersArray.splice(index, 1);
                          setReceiver(allowedUsersArray[0]); 
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

  const fetchUserProfile = (reciever) => {
    return new Promise((resolve, reject) => {
        setLoading(true);
        const dbRef = ref(getDatabase());
        const profileRef = child(dbRef, `users/${reciever}`);

         onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setRecieverData(data);
                resolve(data); 
            } 
        }, (error) => {
 
            reject(error);
        });

            setLoading(false);
     
    });
};


useEffect(() => {
  setLoading(true);
  const getUserProfile = () => {
      const profilePromise = fetchUserProfile(reciever);
      profilePromise.then(profileData => {
              if (profileData) {
                  setLoading(false);
              }
          })
          .catch(error => {
              console.log(error);
          });
  };

  getUserProfile();

}, [reciever]);

 
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
                    if(messagesArray[messagesArray.length-1].chatId === chatId) {
                    setChat(messagesArray);
                    setLastMessage(messagesArray[messagesArray.length-1])
                    

                    // Check for new messages
                    if (messagesArray.length > result.messages.length) {
                      const newMessage = messagesArray[messagesArray.length - 1];
                      setLastMessage(newMessage)
                        if (newMessage.uid !== user.uid && newMessage.chatId === chatId) {
                
                            receiveSend.play();
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

//get user Status

useEffect(() => {
  const fetchStatus = () => {
      return new Promise((resolve, reject) => {;
          const dbRef = ref(getDatabase()); 

          get(child(dbRef, `status/${reciever}`)) 
              .then((snapshot) => {
                  if (snapshot.exists()) {
                      const status = snapshot.val(); 
                      setStatus(status); 
                      resolve(status);
                  }
              })
              .catch((error) => {
          
                  reject(error); 
              });
      });
  };

  fetchStatus()
      .then(() => {

          const statusRef = ref(getDatabase(), `status/${reciever}`);
           onValue(statusRef, (snapshot) => {
              const status = snapshot.val();
              setStatus(status); 
          });

 
      })
      .catch((error) => {
          console.error("Failed to fetch status:", error);
      });

}, [reciever, chatId]);



        const sendMessage = () => {

          if(text ===""){
            return
          }

          const chatRef = ref(getDatabase());

          const db = getDatabase();


// console.log(reciever)
         
      

const postMessagesRef = ref(db, `chat/${chatId}/messages`);
const newPostRef = push(postMessagesRef);
set(newPostRef, {

  serverTime: serverTimestamp(),
  sentAt: serverTimestamp(),
  message: text,
  displayName: user.displayName,
  photoUrl: user.photoURL,
  uid: user.uid,
  chatId: chatId,
});

          set(child(chatRef, "chatList/"+ reciever +"/"+ user.uid), {
 
            chatId: chatId,
            lastMessage: text,
            receiverId: user.uid,
            updatedAt: serverTimestamp(),
            isSeen: false,
        
        });
       
        const input = document.getElementById("send-message__input");

        setText("");
        input.value ="";
        soundSend.play();
        scrollToBottom();



 
        }

//UPDATE USERS LAST MESSAGGE TO TRUE


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
  const emojiToggleHandler = () => {
    setEmojiToggle(!emojiToggle);
    console.log(emojiToggle)
  }

  const handleEmoji =(e)=> {
    setText(prev=>prev+
      e.emoji);
    setEmojiToggle(!emojiToggle);
    console.log(e);

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
        } else {
            console.error("Missing timestamp for message:", chatData);
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



        useEffect(() => {
            const db = getDatabase();
            const chatListRef = ref(db, `chatList/${user.uid}/${reciever}`);
            const userMessageUpdate = ref(db, `chatList/${reciever}/${user.uid}`);

            const updateIsSeen = onValue(chatListRef, (snapshot) => {
            const chatData = snapshot.val();
                if (chatData && !chatData.isSeen) {
                    update(chatListRef, { isSeen: true });
                }
        });

            const UserMessageSeen = onValue(userMessageUpdate, (snapshot) => {
            const messageData = snapshot.val();
                if (messageData && lastMessage?.uid === messageData.receiverId) {
                setSeen(messageData.isSeen);
                }
            });

            return () => {
                updateIsSeen();
                UserMessageSeen(); 
            };
}, [reciever, chatId, lastMessage]);

  return (
    <div className='chat-box__container'>
              {/* <button onClick={closeChat}> Close Chat</button> */}
        <div className='chat__header'>
        { loading ?  (
          <h1> LOADING</h1>

        ) : (
          <div className='chat__banner'>
              <div className='profile__card'>
                        <img alt='user-avatar' src={ recieverData?.photoUrl || Placeholder} />
                        <div className={ status ? status : "status"} ><div className='inner'>
                       
                            </div>
                            </div>
                    </div>
                    <div className='header-details'>
                    <p> {recieverData?.displayName}</p>
                    {status && (
                           <p> {status} </p>
                    )}
               
                    </div>
          </div>
        )}


        <div className='messages__container'ref={messagesContainerRef}>

        <div className='messages__inner'>
     
        {generateMessages()}
        { seen && ( <span id="seen"> Seen </span>)}
 
        {chat.length === 0 && <p>No messages</p>}
    
  </div>
  <div ref={messagesEndRef} /></div> 
  <div className='input__container'>
  <div className='emoji-button' onClick={emojiToggleHandler}> </div>
  <div className='emoji-picker__container'>
  <EmojiPicker open={emojiToggle} emojiStyle="native" onEmojiClick={handleEmoji} theme="dark" height={400} width={400}/>
  </div>
   <input  id="send-message__input" type="text" value={text} onChange={handleMessage} onKeyDown={handleKeyPress} />
        <div id="send-button" onClick={sendMessage}></div>
        </div>
  </div>
       
        </div>
  )
}

export default Chat