import React, { useEffect, useState } from 'react'
import { ref, child, get, getDatabase } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';



const Photos = ({userId}) => {
const [postsWithImagesPublic, setPostsWithImagesPublic] = useState([]);
const [postsWithImagesFriends, setPostsWithImagesFriends] = useState([]);
const { currentUser } = useAuth();
const [isFriend, setIsFriend] = useState(false);
const [isCurrentUser, setIsCurrentUser ] = useState(false);

useEffect(() => {
    if(userId === currentUser.uid) {
        setIsCurrentUser(true);
    }
    else {
        setIsCurrentUser(false);
    }

},[userId])

const checkIfFriend = async () => {
    if(userId === currentUser.uid) return
    try {
        const friendsRef = ref(getDatabase());
        const snapshot = await get(child(friendsRef, `friendsList/${userId}`));
        if (snapshot.exists()) {
            const friendsList = snapshot.val();
            // const friends = Object.values(friendsList)
            // console.log(friends)
            for (const friend in friendsList) {
                if(friend === currentUser.uid) {
                    setIsFriend(true);
                }
            }
        } else {
            return null;
    
        }
        } catch (error) {
        console.error("Error checking friends:", error);
        }
        finally {
            // console.log(postsWithImagesPublic)
        }
}
const getPostsWithPhotosPublic = async () => {
    try {
        const photosRef = ref(getDatabase());
        const snapshot = await get(child(photosRef, `PublicPosts/${userId}`));
        const postsWithImages = [];    
        if (snapshot.exists()) {
            const posts = snapshot.val()
            for (const postKey in posts) {
                const post = posts[postKey];
            
                if (post.imageUrl) {
                  postsWithImages.push(post)
                //   console.log(post)
                } 
              }
              setPostsWithImagesPublic(postsWithImages)
    
        } else {
            return null;
    
        }
        } catch (error) {
        console.error("Error checking friends:", error);
        }
        finally {
            // console.log(postsWithImagesPublic)
        }
    };
    const getPostsWithPhotosFriends = async () => {
        try {
            const photosRef = ref(getDatabase());
            const snapshot = await get(child(photosRef, `FriendsPosts/${userId}`));
            const postsWithImages = [];    
            if (snapshot.exists()) {
                const posts = snapshot.val()
                for (const postKey in posts) {
                    const post = posts[postKey];
                
                    if (post.imageUrl) {
                      postsWithImages.push(post)
                    //   console.log(post)
                    } 
                  }
                  setPostsWithImagesFriends(postsWithImages)
        
            } else {
                return null;
        
            }
            } catch (error) {
            console.error("Error checking friends:", error);
            }
            finally {
                // console.log(postsWithImagesFriends)
            }
        };
useEffect(()=> {
checkIfFriend();
getPostsWithPhotosPublic();
getPostsWithPhotosFriends();

console.log(isFriend)
},[userId])
  return (
    <div className='profile-photos__container'>
        {postsWithImagesPublic.length == 0 && postsWithImagesFriends.length == 0 && (
            <p> Nothing to see here 😔 </p>
        )}
        <div className='photos__container'>
        {postsWithImagesPublic.length > 0 && postsWithImagesPublic.map((post, key) => (
            <div className='img_container' key={key}>
                <img src={post.imageUrl} />
                <div className='like-comment'>
                    <div className='icons'>
                    <p>Like</p>
                    <p> Comment </p>
                    </div>
                    </div>
             </div>
        ))}

{(postsWithImagesFriends.length > 0 && isFriend) || isCurrentUser ? (
  postsWithImagesFriends.map((post, key) => (
    <div className='img_container' key={key}>
      <img src={post.imageUrl} alt="Post" />
      <div className='like-comment'>
                    <div className='icons'>
                    <p>{post?.likes?.length || 0}</p>
                    <p> Comment </p>
                    </div>
                    </div>
    </div>
  ))
) : null}

        
        </div>
    </div>
  )
}

export default Photos