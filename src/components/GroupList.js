import React, { useEffect, useState } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { ref, child, get, getDatabase, onValue } from "firebase/database";
import Placeholder from './images/profile-placeholder-2.jpg';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';


const GroupList = () => {

    const [{ user }] = useStateValue();
    const [groupchats, setGroupchats] = useState([]);
    const navigate = useNavigate();
    const { chatId } = useParams();

    useEffect(() => {
      if (!user || !user.uid) return;
  
      const dbRef = ref(getDatabase(), 'groupChat');
      const groupChatArray = [];
      const uniqueGroup = [];
  
      const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((groupchat) => {
            const groupChatKey = groupchat.key;
            const groupChatData = groupchat.val();
  

            if (groupChatData.allowedUsers.includes(user.uid)) {
              if (!uniqueGroup.includes(groupChatKey)) {
                uniqueGroup.push(groupChatKey);
                groupChatArray.push({
                  groupChatKey,
                  ...groupChatData
                });
              }
            }
          });
          setGroupchats(groupChatArray);
  
        } else {
   
          console.log('No data found');
        }
      });
  
      return () => unsubscribe();
    }, [user, chatId]); 
  


return (
    <div>
      {groupchats.length > 0 && (
        groupchats.map((groupchat) => (
          // <div key={groupchat.groupChatKey} className="groupchat__container" onClick={()=> navigate(`/home/groupchat/${groupchat.groupChatKey}`)}>
          //   <img
          //     alt="avatar"
          //     src={groupchat?.photoUrl ? groupchat?.photoUrl : Placeholder}
          //     className="profile__icon"
          //   />
          // </div>

          <div className="card__container">
                            
                            <div className='chat-details__wrapper'  onClick={()=> navigate(`/home/groupchat/${groupchat.groupChatKey}`)}>
                        <div className='profile__card'>
                            <img alt='user-avatar' src={groupchat?.photoUrl || Placeholder} />
                                </div>
                                
                        <div className='inner-card'>
                            <div className='card-title'>
                        <h1>{groupchat?.name}</h1>
                        </div>
    
                    </div>
                    </div>
                    </div>
        ))
      )}
    </div>
  );
};

export default GroupList;