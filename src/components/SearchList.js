import React, { useState } from 'react'
import Placeholder from '../components/images/avatar_placeholder.png';
import { useStateValue } from './contexts/StateProvider';
import { db } from '../firebase';
import { serverTimestamp, ref, child, get, set, getDatabase, push, onValue } from "firebase/database";

const SearchList = (props) => {

    // console.log(props);
    const [view, setView] = useState(false)
    const [chatId, setChatId] = useState();
    const [{user}, dispatch] = useStateValue();
    const [searchedUser, setSearchedUser] = useState();

    const viewToggle = () => {
      setView(!view);
      setSearchedUser(props.results);
    }

    const close = () => {
      setView(!view);
    }

    const createChat = () => {
      //create a chat collection for CURRENT user
      const currentUser = user.uid;
      const searched = searchedUser.uid;
      const dbRef = ref(getDatabase());

//check if 

//check if userid is in chatlist, IF user is not in chatList, create a new Chat, ADD user to chatList and UPDATE 

const chatRef = ref(getDatabase());
get(child(chatRef, `chatList/`)).then((snapshot) => {

//     get(child(chatRef, `chatList/`+ user.uid)).then((snapshot) => {
  //MAIN
  const newChatKey = push(child(dbRef, 'chat')).key;

  if (!snapshot.exists()) {

    set(child(dbRef, "chat/"+ newChatKey), {
    createdAt: serverTimestamp(),
    messages: {}
  })   
    set(child(dbRef, "chatList/"+ searchedUser.uid+"/"+ user.uid), {
 
                chatId: newChatKey,
                lastMessage: "",
                recieverId: user.uid,
                updatedAt: serverTimestamp()
            
            })


          set(child(dbRef, "chatList/"+ user.uid+"/"+ searchedUser.uid), {
         
          chatId: newChatKey,
          lastMessage: "",
          recieverId: searchedUser.uid,
          updatedAt: serverTimestamp()
        
      })
    
  } 
    //CHECK IF USER ID IS ALREADY IN LIST

    if (snapshot.exists()) {
         const chatListData = snapshot.val();

         //MAIN
          if(!chatListData.hasOwnProperty(user.uid)) {
      // const newChatKey = push(child(dbRef, 'chat')).key;
      set(child(dbRef, "chat/"+ newChatKey), {
        createdAt: serverTimestamp(),
        messages: {}
      })   

      set(child(dbRef, "chatList/"+ searchedUser.uid+"/"+ user.uid), {
 
        chatId: newChatKey,
        lastMessage: "",
        recieverId: user.uid,
        updatedAt: serverTimestamp()
    
    })


  set(child(dbRef, "chatList/"+ user.uid+"/"+ searchedUser.uid), {
 
  chatId: newChatKey,
  lastMessage: "",
  recieverId: searchedUser.uid,
  updatedAt: serverTimestamp()

})

    }
    if(!chatListData.hasOwnProperty(searchedUser.uid)) {

      set(child(dbRef, "chat/"+ newChatKey), {
        createdAt: serverTimestamp(),
        messages: {}
      })   

      set(child(dbRef, "chatList/"+ searchedUser.uid+"/"+ user.uid), {
     
        chatId: newChatKey,
        lastMessage: "",
        recieverId: user.uid,
        updatedAt: serverTimestamp()
    
    })
    
    
    set(child(dbRef, "chatList/"+ user.uid+"/"+ searchedUser.uid), {
    
    chatId: newChatKey,
    lastMessage: "",
    recieverId: searchedUser.uid,
    updatedAt: serverTimestamp()
    
    })
    
  }
    }


})

.catch((error) => {
  console.error(error);
});
  

    }
  return (
    <div className='searched-user__container'>

{!view && (
  <div className='searched-user__box'>
  <img src={props.results.photoUrl || Placeholder}></img>
          <p> {props.results.displayName} </p>
          <p> {props.results.uid} </p>
          <button onClick={viewToggle}> View User </button>
          </div>
        
)}

{view && (
  <div className='searched-user__box'>

    <h1> nice view</h1>
    <button onClick={createChat}> message</button>
    <button onClick={close}> X </button>
    {/* <h1> {searchedUser.uid}</h1> */}
    </div>
)}
</div>
  )
}

export default SearchList


