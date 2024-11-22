import React, { useState, useEffect, useRef } from 'react'
import { ref, get, getDatabase, update} from 'firebase/database';
import { ref as sRef, getDownloadURL, getStorage, uploadBytes } from 'firebase/storage';
import { useStateValue } from './contexts/StateProvider';
import { useParams } from 'react-router-dom';
import ArrowDownIcon from './svg/arrow-down.svg';
import Placeholder from './images/profile-placeholder-2.jpg';

const ChatInfo = ({groupChat}) => {

    const [editChat, setEditChat] = useState(false);
    const [groupchat, setGroupChat] = useState(groupChat);
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);
    const [{ user }] = useStateValue();
    const { chatId } = useParams();
    const storage = getStorage();
    const [openDropDown, setOpenDropDown] = useState(null);
    const [changes, setChanges] = useState(false);
    const dropdownRef = useRef(null);
    const [addMembersMenu, setAddMembersMenu] = useState(false);
    const [text, setText] = useState();
    const [userList, setUserList] = useState([]);
    const [ searchedIds ,setSearchIds] = useState([]);

    // console.log(groupChat)

useEffect(() => {
    setEditChat(false);
}, [chatId]);

const saveGroupChatName = () => {

    const newName = document.getElementById("edit-groupchat-name__box").value;
    update(ref(getDatabase(), `groupChat/${chatId}`), {
        ...groupChat,
        name: newName
      })

      const updatedGroupChat = { ...groupchat, name: newName };
      setGroupChat(updatedGroupChat);
}

const saveGroupChatDescription = () => {

    const newDescription = document.getElementById("edit-discription").value;
    update(ref(getDatabase(), `groupChat/${chatId}`), {
        ...groupChat,
        description: newDescription
      })

      const updatedGroupChat = { ...groupchat, description: newDescription };
      setGroupChat(updatedGroupChat); 
}

const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      handlePhotoFile(e.target.files[0]);
    }
  };

  const handlePhotoFile = async (photo) => {

    setLoading(true);
    const fileRef = sRef(storage, `${chatId}-chatImage.png`);

    try {
      await uploadBytes(fileRef, photo);
      const photoLink = await getDownloadURL(fileRef);

      await update(ref(getDatabase(), `groupChat/${chatId}`), {
        ...groupChat,
        photoUrl: photoLink
      })

      const updatedGroupChat = { ...groupchat, photoUrl: photoLink };
      setGroupChat(updatedGroupChat); 
      setLoading(false);

    } catch (error) {
      console.error("Error uploading file:", error);
      setLoading(false);
    }
  }
  useEffect(() => {
    setChanges(false);
    const fetchUserData = async () => {
      const dbRef = ref(getDatabase(), `groupChat/${chatId}`);

      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const membersArray = []
          const data = snapshot.val();
          let users = data.allowedUsers;


          for (let userId of users) {
            const userRef = ref(getDatabase(), `users/${userId}`);
            const userDataSnapshot = await get(userRef);
            if (userDataSnapshot.exists()) {
              const userData = userDataSnapshot.val();
            
              membersArray.push(userData);
            } else {
              console.log(`No data for user: ${userId}`);
            }
          }
          const filteredMembers = [...new Set(membersArray)];
          setMembers(filteredMembers);

        } else {
          console.log('No data found for this chat');
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchUserData();

  }, [chatId, user, changes]);

  const toggleDropDown = (e, memberId) => {
    e.stopPropagation();
    setOpenDropDown(prev => (prev === memberId ? null : memberId));
}

useEffect(() => {
    const handleClickOutside = (event) => {
        
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropDown(null); 
      } 
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
        document.removeEventListener('click', handleClickOutside);
      };

  }, []);

const makeAdmin = async (memberId) => {
  const dbRef = ref(getDatabase(), `groupChat/${chatId}`);

  try {
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      let admin = snapshot.val().admin || [];

    if (!admin.includes(memberId)) {
      admin.push(memberId);

      await update(dbRef, {
        admin: admin,
      });
      const updatedGroupChat = { ...groupchat, admin: admin };
      setGroupChat(updatedGroupChat)
      setOpenDropDown(null);
    }
  }
}
  catch(error) {
    console.log(error);
  }
}

const kickMember = async (memberId) => {
  const dbRef = ref(getDatabase(), `groupChat/${chatId}`);


  try {
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      let allowedUsers = snapshot.val().allowedUsers || [];

      if(allowedUsers.length > 0 ) {
        const filteredArray = allowedUsers.filter(userId => userId !== memberId)

      await update(dbRef, {
        allowedUsers: filteredArray,
      });
      const filteredMembers = members.filter(member => member.uid !== memberId);
      setMembers(filteredMembers);

      const updatedGroupChat = { ...groupchat, allowedUsers: filteredArray };
      setGroupChat(updatedGroupChat)

      setOpenDropDown(null);
      setChanges(true);
    }
    
  }
}
catch(error) {
  console.log(error);
}

}
const handleKeyPress = (event) => {
  if( event.key === "Enter") {
    searchUserByID();
  }
};
const handleTextChange = (e) => {
  setText(e.target.value);
};
const searchUserByID = async () => {
  const dbRef = ref(getDatabase(), 'users');

  try {
    const snapshot = await get(dbRef);
    const searchValue = text.trim();
    if(snapshot.exists()) {
      const data = snapshot.val();
      const users = Object.values(data);

      const searchableUsers = users.filter(user => !members.some(member => member.uid === user.uid));

      searchableUsers.forEach((user) => {
        if(searchValue === user.displayName){
          setUserList(prev=>[...prev, user]);
          setMembers(prev=>[...prev, user]);
          setSearchIds(prev=>[...prev, user.uid])

        }
      })
    }
  }

  catch(error) {
    console.log(error);
  }
// setUserList(arr);

}
const addMembers = async () => {
  const dbRef = ref(getDatabase(), `groupChat/${chatId}`);

  try {
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      let allowedUsers = snapshot.val().allowedUsers || [];

      const newGroupMembers = allowedUsers.concat(searchedIds);
      console.log(newGroupMembers)
  
        await update(dbRef, {
          allowedUsers: newGroupMembers,
        });
        const updatedGroupChat = { ...groupchat, allowedUsers: newGroupMembers };
        setGroupChat(updatedGroupChat)
        setAddMembersMenu(false);
    }

  }
  catch(error) {
    console.log(error);
  }
}
  return (
    <div className='chat-info__container'>
        {!editChat ? (
                 <div className='main__chat-info'>
                    <div className='close__container'>
                    <button onClick={()=>setEditChat(prev=>!prev)}> Edit </button>
                </div>

                <div className='edit-group-photo'>
                <img src={groupchat?.photoUrl || Placeholder } alt="group-profile" />
                </div>
                 <h1> {groupchat?.name}</h1>

                 {groupchat?.description && (
                <div className='description'>
                    <p> {groupchat?.description} </p>
                    </div>
                 )}
                 <div className='members'>
                  <div className='title'>
                 <h3> Group · {groupchat?.allowedUsers.length} Members</h3>
                 <p onClick={()=>setAddMembersMenu(prev => !prev)}> Add members </p>
                 </div>

                 {members && members.length > 0 && members.map((member) => {
                     const isAdmin = groupchat.admin.includes(member.uid); 
                    const isDropDownActive = openDropDown === member.uid;
                    const kickAble = member.uid !== user.uid;
                    return (
                        <div className='user__container' key={member.uid}>
                            <div className='profile'>
                                <img src={member.photoUrl || Placeholder} alt="profile" />
                                </div>
                                <div className='user__text'>
                            <h3> {member.displayName}</h3>

                            {isAdmin ? (
                                <p> Admin </p>
                            ) : (
                                <p> Member </p>
                            )}
                            </div>
                          {member.uid !== user.uid && (
                            <div className='menu'>
                              <img src={ArrowDownIcon} className={isDropDownActive ? 'active' : ''} alt="drop-down-menu"  onClick={(e) => toggleDropDown(e, member.uid)}/>

                              
{isDropDownActive && (
                    <div ref={dropdownRef} className='drop-down__menu'>
                        {!isAdmin && (
                             <p onClick={()=> makeAdmin(member.uid)}> Assign Admin </p>
                             )}
                             {kickAble && (
                                <p onClick={()=> kickMember(member.uid)}> Kick </p>
                             )}
                           
                            </div>
                          )}
                              </div>
                          )}
       
                  
                        </div>
                            
                    )
                 })}
                 </div>

                 {addMembersMenu && (
                  <div className='add-members-menu'>
                    <div className='title-add-users'>
                    <h1> Add Members </h1>
                    <button onClick={()=>setAddMembersMenu(prev=>!prev)}> Close </button>
                    </div>

                    <div className='search-user__form'>
                    <input type='text' placeholder='Search for users' onChange={handleTextChange} onKeyDown={handleKeyPress}></input>
                      {userList.length > 0 && userList.map((data, key) => (
                      <div className='search__user-list'>
                          <h1> {data.displayName}</h1>
                          </div>
                          ))}

                          {userList.length > 0 && <button onClick={addMembers}> Add Members </button> }

                    </div>
                    </div>

                 )}
                 </div>
        ) : (
            <div className='edit__chat-info'>
                <div className='close__container'>
                    <button onClick={()=>setEditChat(prev=>!prev)}> Close </button>
                </div>
            {/* <h1> Edit </h1> */}
            <div className='edit-group-photo'>

                
            {loading ? (
                <div className='loading'></div>
            ) : (
                <img src={groupchat?.photoUrl || Placeholder } alt="group-profile" />
            )}
                  </div>

                <label htmlFor="file-upload" className="custom-file-upload">
        Change group photo
      </label>
                <input id="file-upload" type="file" onChange={handlePhotoChange} disabled={loading}/>
            <div className='edit__form'>

            <p> Group chat name</p>
              <input
                id="edit-groupchat-name__box"
                type="text"
                defaultValue={groupchat?.name}
              />
                         <button onClick={saveGroupChatName}> save </button>
              <p>Description</p>
              <textarea
                id="edit-discription"
                rows="4"
                defaultValue={groupchat?.description || ""}
              ></textarea>
    
              <button onClick={saveGroupChatDescription}> save </button>

              </div>
            </div>

        )}
    </div>
  )
}

export default ChatInfo