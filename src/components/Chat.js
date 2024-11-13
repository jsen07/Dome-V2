import React, { useEffect, useState, useRef } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { useParams } from 'react-router-dom';
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue, update, remove } from "firebase/database";
import ChatMessage from './ChatMessage';
import sendSoundEffect from '../components/sound/sendingSound.mp3';
import receivingSoundEffect from '../components/sound/receivingSound.mp3';
import { Howl } from 'howler';
import Placeholder from '../components/images/avatar_placeholder.png';
import EmojiPicker from 'emoji-picker-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Chat = () => {

    const [ {user} ] = useStateValue();
    const [text, setText] =useState("");
    const [reciever, setReceiver] = useState();
    const [chat, setChat] = useState([]);
    const [seen, setSeen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const [path, setPath] = useState();
    const navigate = useNavigate();


    const messagesEndRef = useRef(null);
    const seenEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const { chatId } = useParams();
    const [loading, setLoading] = useState(true);
    const [recieverData, setRecieverData] = useState();
    const [status, setStatus] = useState("Offline");
    const [emojiToggle, setEmojiToggle] = useState(false);
    const [lastMessage, setLastMessage] = useState();
    const [unseenMessages, setUnseenMessages] = useState({});
    const inputRef = useRef(null);
    const notificationSentRef = useRef(false);
    const typingTimeoutRef = useRef(null);
    const location = useLocation();

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
  if (reciever) {
    getUserProfile();
}

}, [reciever]);

 
  useEffect(() => {
    setLoading(true); 
    setPath(location.pathname)
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

                            if(newMessage.type === 'direct') {
                                receiveSend.play();
                              }
                              
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

         
      

const postMessagesRef = ref(db, `chat/${chatId}/messages`);
const newPostRef = push(postMessagesRef);
const uniqueId = newPostRef.key;
set(newPostRef, {

  serverTime: serverTimestamp(),
  sentAt: serverTimestamp(),
  message: text,
  displayName: user.displayName,
  photoUrl: user.photoURL,
  uid: user.uid,
  chatId: chatId,
  type: 'direct'
});

          set(child(chatRef, "chatList/"+ reciever +"/"+ user.uid), {
 
            chatId: chatId,
            lastMessage: text,
            receiverId: user.uid,
            updatedAt: serverTimestamp(),
            isSeen: false,
            id: uniqueId
        
        });

        const notificationRef = ref(db, `chatList/${reciever}/notifications/${user.uid}/messages`);
        const newNotifRef = push(notificationRef);
        set(newNotifRef, {
            message: text,
            displayName: user.uid,
            sentAt: serverTimestamp(),
            isSeen: false,
            chatId: chatId,
            id: uniqueId,
        });   
       
        const input = document.getElementById("send-message__input");

        setText("");
        input.value ="";
        notifyTyping(chatId, user.uid, false);
        soundSend.play();



 
        }

        const scrollToBottom = () => {
          if (messagesEndRef.current) {
              if (!seenEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
              } else {
                  seenEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }
          }
      };
  
      const handleScroll = () => {
          const container = messagesContainerRef.current;
          if (!container) return;
          const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
          setIsAtBottom(isAtBottom);
      };
  
      useEffect(() => {
        const timer = setTimeout(() => {
            scrollToBottom();
        }, 50); 
    
        return () => clearTimeout(timer);
    }, [chat, seen]);

  
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
    
  }

  const handleEmoji =(e)=> {
    setText(prev=>prev+
      e.emoji);
    setEmojiToggle(!emojiToggle);
    inputRef.current.focus();

  }

  const generateMessages = () => {
    const dateMap = {};

    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : 1));

    const today = now.toISOString().split('T')[0];
    const startOfWeekString = startOfWeek.toISOString().split('T')[0];

    chat.forEach(chatData => {
        if (chatData.chatId === chatId) {
            const timestamp = chatData.sentAt;

            if (timestamp) {
                const date = new Date(timestamp);

                if (!isNaN(date)) {
                    const dateString = date.toISOString().split('T')[0];

                    if (!dateMap[dateString]) {
                        dateMap[dateString] = { label: dateString, messages: [] };
                    }
                    if (dateString === today) {
                        dateMap[dateString].label = "Today"; 
                    }

                    else if (dateString >= startOfWeekString && dateString <= today) {
                        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
                        dateMap[dateString].label = dayOfWeek;
                    } else {
                        const formattedDate = date.toLocaleDateString("en-US", { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        });
                        dateMap[dateString].label = formattedDate;
                    }

                    dateMap[dateString].messages.push(chatData);
                } else {
                    console.error("Invalid date:", timestamp);
                }
            }
        }
    });

    return Object.keys(dateMap).map(date => (
        <div key={date} className='date-container'>
            <div className='date-notify'>
                <div className='title-date'>
                    <h4>{dateMap[date].label}</h4>
                    </div>
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
            // const notificationRef = ref(db, `chatList/${reciever}/notifications/${user.uid}/messages`);
 
        

            const updateIsSeen = onValue(chatListRef, (snapshot) => {
                const messageToDelete = ref(db, `chatList/${user.uid}/notifications/${reciever}/messages`);
            const chatData = snapshot.val();
                if (chatData && !chatData.isSeen) {
                    update(chatListRef, { isSeen: true });

                    console.log("Deleting from path:", messageToDelete.toString());

                remove(messageToDelete).catch(error => {
                    console.error('Error deleting message:', error);
                });
                    
                }
        });
                
                const UserMessageSeen = onValue(userMessageUpdate, (snapshot) => {
                    const messageData = snapshot.val();
                    
                    if (messageData && lastMessage?.uid === messageData.receiverId) {
                        setSeen(messageData.isSeen);
        
                      
                    } else {
                        setSeen(false);
                    }
                });
        
                return () => {
                    updateIsSeen();
                    UserMessageSeen();
             
                };

}, [reciever, chatId, lastMessage]);

const notifyTyping = (chatId, userId, typing, displayName) => {
    set(ref(getDatabase(), `typingStatus/${chatId}/${userId}`), typing)
};

const handleInputChange = (e) => {
    setText(e.target.value);

    // Notify typing status for the recipient
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (!isTyping) {
        setIsTyping(true);
        notifyTyping(chatId, user.uid, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        notifyTyping(chatId, user.uid, false);
    }, 1000); 
};

// Listen for typing status updates from the recipient
useEffect(() => {
    const typingRef = ref(getDatabase(), `typingStatus/${chatId}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
        const usersTyping = {};
        snapshot.forEach(childSnapshot => {
            const userId = childSnapshot.key;
            if (childSnapshot.val() && userId === reciever) {
                usersTyping[userId] = true;
            }
        });
        setTypingUsers(usersTyping);
    });

    return () => unsubscribe();
}, [chatId, reciever]);



  return (
    <div className='chat-box__container'>
              {/* <button onClick={closeChat}> Close Chat</button> */}
        <div className='chat__header'>
        { loading ?  (
   
   <div className='loading'></div>

        ) : (
          <div className='chat__banner'>
              <div className='profile__card' onClick={()=> navigate(`/home/profile?userId=${recieverData?.uid}`)}>
                        <img alt='user-avatar' src={ recieverData?.photoUrl || Placeholder} />
                        <div className={ status ? status : "status"} ><div className='inner'>
                       
                            </div>
                            </div>
                    </div>
                    <div className='header-details'>
                    <h1> {recieverData?.displayName}</h1>
                    {status && (
                           <p className={ status ? `details ${status}` : "details"}> {status} </p>
                    )}
               
                    </div>
          </div>
        )}


        <div className='messages__container'ref={messagesContainerRef}>

        <div className='messages__inner'>
     
        {generateMessages()}
      
        <div className='seen__container'>
        {Object.keys(typingUsers).length > 0 &&
                      <p id="typing">{recieverData ? `${recieverData.displayName} is typing...` : "Loading..."}</p>}
        { seen && Object.keys(typingUsers).length === 0 && ( <span ref={seenEndRef}> Seen </span>)}
        </div>
 
        {chat.length === 0 && <p>No messages</p>}
    
  </div>
  <div ref={messagesEndRef} /></div> 
  <div className='input__container'>
  <div className='emoji-button' onClick={emojiToggleHandler}> </div>
  <div className='emoji-picker__container'>
  <EmojiPicker open={emojiToggle} emojiStyle="native" onEmojiClick={handleEmoji} theme="light" height={400} width={400}/>
  </div>
   <input  id="send-message__input" placeholder="Type a message..." type="text"  ref={inputRef} value={text} onChange={handleInputChange} onKeyDown={handleKeyPress} />
        <div id="send-button" onClick={sendMessage}></div>
        </div>
  </div>
       
        </div>
  )
}

export default Chat
