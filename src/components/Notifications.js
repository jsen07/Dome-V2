import React, { useState, useEffect } from 'react'
import { useStateValue } from './contexts/StateProvider';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ref, child, get, getDatabase, remove, set, onValue } from 'firebase/database';
import Button from '@mui/material/Button';

const Notifications = () => {

const [{ user }] = useStateValue();
const { currentUser } = useAuth();
const navigate = useNavigate();
const [requestList, setRequestList] = useState([]);
const [postList, setPostList] = useState([]);
const [messagesList, setMessagesList] = useState([]);
const [allNotifs, setAllNotifs] = useState([]);
const [activeLink, setActiveLink] = useState('all'); 
const [loading, setLoading] = useState(false);
const [mergedAndSortedList, setMergedAndSortedList] = useState([]);


const handleLinkClick = (link) => {
    setActiveLink(link);
};


useEffect(() => {

    const combinedNotifs = [...requestList, ...messagesList];
    if (combinedNotifs.length > 0) {
      setAllNotifs(combinedNotifs);
    } 
  
  },[requestList, postList, messagesList]);
function formatTimestamp(timestamp) {
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
        
        return timeOfMessage;

    } else if (timestampDate >= yesterdayStart) {
        return "Yesterday";
    } else if (timestampDate >= startOfWeek) {
        const dayOfWeek = timestampDate.toLocaleString('en-US', { weekday: 'long' });
        return dayOfWeek;
    } else {
        return timestampDate.toLocaleDateString("en-US", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        }
    }

// GET USER FRIEND REQUESTS
const checkForFriendRequests = async () => {
    try {
        setLoading(true);
        const friendsRef = ref(getDatabase());
        const snapshot = await get(child(friendsRef, `friendRequests/${user.uid}`));
        
        if (snapshot.exists()) {
            const data = snapshot.val()
            return data;

        } else {
            return null;

        }
      } catch (error) {
        console.error("Error checking friends:", error);
      }
      finally {
        setLoading(false)
      }
    };
useEffect(()=> {
    const friendsRef = ref(getDatabase(), `friendRequests/${user.uid}`);
    onValue(friendsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = Object.values(snapshot.val());
            setRequestList(data);
        } else {

            setRequestList([]);
        }
    });
},[])

const getRequestList = async () => {
    const requests = await checkForFriendRequests();
    if(requests !== null) {
        const requestArray = Object.values(requests);
        setRequestList(requestArray);
    } else {
        setRequestList([]);
    }
}

const handleReject = async (userId) => {
    try {
    const friendsRef = ref(getDatabase());
    const snapshot = await get(child(friendsRef, `friendRequests/${currentUser.uid}`));

    if (snapshot.exists()) {
        const data = snapshot.val();
        const requests = Object.values(data);
        const filtered = requests.filter(data => data.uid !== userId);

        if (filtered.length === 0) {
            await remove(child(friendsRef, `friendRequests/${currentUser.uid}`))
        }
        else {
            await set(child(friendsRef, `friendRequests/${currentUser.uid}`), filtered);
        }
        setRequestList(filtered);
    }
    else {
        console.log('no friend requests')
    }
    }
    catch(error) {
        console.log(error);
    }
}

const handleAccept = async (userId, displayName, photoURL) => {

    const friendsData = {
        uid: userId
    }
    const currentUserData = {
        uid: currentUser.uid
    }
    try {
        const friendsRef = ref(getDatabase());
        const friendsListRef = ref(getDatabase(), `friendsList/${currentUser.uid}/${userId}`);
        const recieverFriendsListRef = ref(getDatabase(), `friendsList/${userId}/${currentUser.uid}`);

        await set(friendsListRef, friendsData);
        await set (recieverFriendsListRef, currentUserData);

        const requestListArray = Object.values(requestList);
        const filteredRequestList = requestListArray.filter(data => data.uid !== userId);

        await set(child(friendsRef, `friendRequests/${currentUser.uid}`), filteredRequestList);
        setRequestList(filteredRequestList)

    }
    catch(error) {
        console.log(error)
    }

}

const checkForMessages = async () => {
    try {
        setLoading(true);
        const dbRef = ref(getDatabase());
        const snapshot = await get(child(dbRef, `notifications/chat/${currentUser.uid}`));
        let newMessageNotifs = []
        if (snapshot.exists()) {
            const data = Object.values(snapshot.val());

            for (const message of data) {
                const snap = await get(child(dbRef, `users/${message.recieverId}`));
                if(snap.exists()){
                    const user = snap.val();
                newMessageNotifs.push({
                    ...message,
                    displayName: user.displayName,
                })
            }
        }
        return newMessageNotifs;
    } else {
            return null;
        }
    } 
    catch (error) {
        console.error("Error checking friends:", error);
    }
      finally {
        setLoading(false)
      }
    };
const getMessagesList = async () => {
        const requests = await checkForMessages();
        if(requests !== null) {
            const requestArray = Object.values(requests);
            setMessagesList(requestArray);
        } else {
            setMessagesList([]);
        }
    }

useEffect(()=> {
    const dbRef = ref(getDatabase());
    const notifRef = ref(getDatabase(), `notifications/chat/${currentUser.uid}`);
    onValue(notifRef, async (snapshot) => {
        let newMessageNotifs = []
        if (snapshot.exists()) {
            const data = Object.values(snapshot.val());

            for (const message of data) {
                const snap = await get(child(dbRef, `users/${message.recieverId}`));
                if(snap.exists()){
                    const user = snap.val();
                newMessageNotifs.push({
                    ...message,
                    displayName: user.displayName,
                })
            }
        }
        setMessagesList(newMessageNotifs);
    }
    });
},[]);

useEffect(() => {
    const dbRef = ref(getDatabase());
    const postRef = ref(getDatabase(), `notifications/posts/${currentUser.uid}`);
    let newPost = [];
    
    onValue(postRef, async (snapshot) => {
        if (snapshot.exists()) {
            const data = Object.values(snapshot.val());
            

            for (const comment of data) {
                const newComment = Object.values(comment);
                for (const nestedComment of newComment) {
                    const commentData = Object.values(nestedComment);
                    // console.log(commentData)


                    const userPromises = commentData.map(async (data) => {
                        const snap = await get(child(dbRef, `users/${data.uid}`));
                        if (snap.exists()) {
                            // console.log(data)
                            const snapshot = await get(child(dbRef, `${data.type}Posts/${currentUser.uid}/${data.postId}`));
                            const userDetails = snap.val();
                            if(snapshot.exists()) {
                                const postData = snapshot.val();
                                newPost.push({
                                ...data,
                                imageUrl: postData?.imageUrl || '',
                                post: postData?.post || '',
                                displayName: userDetails.displayName,
                            })
                                
                            }
                        }
                    });
                    await Promise.all(userPromises);
                }
            }
        }
        setPostList(newPost);
    });
}, [currentUser]);

const NewCommentsOnPosts = ({comment, displayName, imageUrl, post, postId, timestamp, type, uid}) => {

    return (
    <div key={postId} className="request__container">
        <div className="time__header">
            <p>{formatTimestamp(timestamp)}</p>
            </div>
            <div className='post__notifs'>
            <p>{displayName} has commented  
                <span className='controlled'> "{comment}"</span> 
                {post ? 
                <span> on your post : {post} </span>
                 : ''} </p>

            {imageUrl && (
                <div className='image-notif__container'>
                <img src={imageUrl} alt="image-post"/>
                </div>
            )}

            </div>
            <div className="request__action-buttons">
                <Button variant="contained" className='fr-buttons contained'>Go to Post</Button>
                <Button variant="outlined" className='fr-buttons'>Close</Button>
                </div>
                </div>
            
)}

const NewMessages = ({chatId, timestamp, displayName}) => {

    return (
    <div key={chatId} className="request__container">
        <div className="time__header">
            <p>{formatTimestamp(timestamp)}</p>
            </div>
            <p>{displayName} has sent you a new message </p>
            <div className="request__action-buttons">
                <Button variant="contained" className='fr-buttons'
                onClick={()=> navigate(`/chats/${chatId}`)}
                >Go to message</Button>
                <Button variant="outlined" className='fr-buttons'>Close</Button>
                </div>
                </div>
            
)}
const NewRequests = ({ uid, displayName, timestamp, photoUrl }) => {
    return (
        <div key={uid} className="request__container">
        <div className="time__header">
          <p>{formatTimestamp(timestamp)}</p>
        </div>
        <p>{displayName} would like to send you a friend request</p>
        <div className="request__action-buttons">
          <Button variant="contained" className='fr-buttons contained' onClick={() => handleAccept(uid, displayName, photoUrl || "")}>Accept</Button>
  
          <Button variant="outlined" className='fr-buttons' onClick={() => handleReject(uid)}>Reject</Button>
        </div>
      </div>
    )
}

useEffect(() => {
    //combine lists and sort
    const combinedList = [
      ...requestList.map((item) => ({ ...item, type: 'request' })),
      ...postList.map((item) => ({ ...item, type: 'post' })),
      ...messagesList.map((item) => ({ ...item, type: 'message' })),
    ];
  
  
    combinedList.sort((a, b) => b.timestamp - a.timestamp);
  
    setMergedAndSortedList(combinedList);
  }, [requestList, postList, messagesList]);

return (
    allNotifs && allNotifs.length > 0 ? (
      <div className="notifications__container">

        <div className="notification-header">
          <h1> Notifications </h1>
          <div className="notification__tabs">
          <Button className='filter-buttons' variant="text"  
          onClick={
            ()=>{
            handleLinkClick('all')
            getRequestList();
            getMessagesList();
            }
        }
            >All</Button>
          <Button className='filter-buttons' variant="text" 
          onClick={
            ()=>{
                handleLinkClick('requests')
                getMessagesList();
          }
          }>Requests</Button>
          <Button className='filter-buttons' variant="text"  onClick={()=>handleLinkClick('posts')}>Posts</Button>
          <Button className='filter-buttons' variant="text"  onClick={()=>handleLinkClick('messages')}>Messages</Button>
          </div>
        </div>

        <div className="notification__content">


{activeLink === 'all' && (

<>
{mergedAndSortedList.map((item, index) => {
  switch (item.type) {
    case 'request':
      return (
        <NewRequests
          key={item.uid}
          uid={item.uid}
          displayName={item.displayName}
          timestamp={item.timestamp}
          photoUrl={item.photoUrl}
        />
      );

    case 'post':
      return (
        <NewCommentsOnPosts
          key={item.postId}
          comment={item.comment}
          displayName={item.displayName}
          imageUrl={item.imageUrl}
          post={item.post}
          postId={item.postId}
          timestamp={item.timestamp}
          type={item.type}
          uid={item.uid}
        />
      );

    case 'message':
      return (
        <NewMessages
          key={item.chatId}
          chatId={item.chatId}
          displayName={item.displayName}
          timestamp={item.timestamp}
        />
      );

    default:
      return null;
  }
})}
</>


)}

{activeLink === 'requests' && (
<>
{requestList.map(({ uid, displayName, timestamp, photoUrl }, index) => (

    <NewRequests
    key={uid}
    uid={uid}
    displayName={displayName}
    timestamp={timestamp}
    photoUrl={photoUrl}
    />

  ))}

{requestList.length === 0 && (
        <div className="request__container">
                <p> Nothing to see here 🌝</p>
        </div>
  )}
  </>
            
)}

{activeLink === 'posts' && (
<>
{postList.map(({ comment, displayName, imageUrl, post, postId, timestamp, type, uid }, index) => (
    
    <NewCommentsOnPosts
    key={postId}
    comment={comment}
    displayName={displayName}
    imageUrl={imageUrl}
    post={post}
    postId={postId}
    timestamp={timestamp}
    type={type}
    uid={uid}
    />
  ))}
    {postList.length === 0 && (
        <div className="request__container">
                <p> Nothing to see here 🌝</p>
        </div>
  )}
  </>
            
)}

{activeLink === 'messages' && (
<>
{messagesList.map(({ chatId, displayName, sentAt }, index) => (
    
    <NewMessages
    key={chatId}
    chatId={chatId}
    displayName={displayName}
    sentAt={sentAt}
    />
  ))}

  {messagesList.length === 0 && (
        <div className="request__container">
                <p> Nothing to see here 🌝</p>
        </div>
  )}
  </>
            
)}

        </div>


      </div>
    ) : (
      <div className="notifications__container">
           <div className="notification-header">
        <h1> Notifications </h1>
        <p>No new notifications at the moment.</p>
        </div>
      </div>
    )
  );
  
}

export default Notifications