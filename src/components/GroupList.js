import React, { useEffect, useState } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { ref, child, get, getDatabase, onValue } from "firebase/database";
import Placeholder from './images/avatar_placeholder.png';
import { useNavigate } from 'react-router-dom';


const GroupList = () => {

    const [{ user }] = useStateValue();
    const [groupchats, setGroupchats] = useState([]);
    const navigate = useNavigate();


function fetchGroupChats () {

    return new Promise((resolve, reject) => {
    const dbRef = ref(getDatabase(), `groupChat`);
    const groupChatArray = [];

        onValue(dbRef,(snapshot) =>{

            if(snapshot.exists()) {

            snapshot.forEach(groupchat => {
                const groupChatKey = groupchat.key;
                const groupChatData = groupchat.val();
                if(groupChatData.allowedUsers.includes(user.uid)) {
                const groupchatObject = {
                    groupChatKey,
                    ...groupChatData
                };
                groupChatArray.push(groupchatObject);
            }
                
            });
            setGroupchats(groupChatArray);
            resolve(groupChatArray)
        } else {
             reject('No data found');
        }
        })
    
});
}
useEffect(() => {

    if (!user || !user.uid) return; 

    fetchGroupChats().then((groupchat) => {
        // console.log(groupchat)

    }).catch(error => {
        console.log(error);
    });


},[user])


return (
    <div>
      {groupchats.length > 0 && (
        groupchats.map((groupchat) => (
          <div key={groupchat.groupChatKey} className="groupchat__container" onClick={()=> navigate(`/home/groupchat/${groupchat.groupChatKey}`)}>
            <img
              alt="avatar"
              src={groupchat?.photoURL ? groupchat?.photoURL : Placeholder}
              className="profile__icon"
            />
          </div>
        ))
      )}
    </div>
  );
};

export default GroupList;