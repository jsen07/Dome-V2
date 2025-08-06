import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CloseButton from './svg/x-close-delete-svgrepo-com.svg';
import Placeholder from './images/profile-placeholder-2.jpg';
import PostsComment from './PostsComment';
import ClickAwayListener from '@mui/material/ClickAwayListener';

const FullscreenPost = ({handleClick, post}) => {
    const navigate = useNavigate();

    const closeDropdown = (e) => {
        if (e.target.closest('post-content-f')) {
            handleClick(); 
          }
      };
    
      useEffect(() => {
        document.addEventListener('click', closeDropdown);
        return () => document.removeEventListener('click', closeDropdown);
      }, []);
  

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
            
            
            return `Today at ${timeOfMessage}`;
      
        } else if (timestampDate >= yesterdayStart) {
            return `Yesterday at ${timeOfMessage}`;
        } else if (timestampDate >= startOfWeek && timestampDate <= todayStart) {
        
            return `${dayOfWeek} at ${timeOfMessage}`
        } else {
            return `${timestampDate.toLocaleDateString("en-US", { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })} at ${timeOfMessage}`
            }
      }
  return (
    <div className='post__fullscreen'>

        <div className='post-f'>
            <img id="close-button" src={CloseButton}  onClick={handleClick} alt="close menu"/>
            <div className='post-content-f'>
            <ClickAwayListener onClickAway={handleClick}>  
            <div className='post__fs'>
                <div className='image-container'>
                    <img src={post?.imageUrl} alt='post-image' />
                    </div>
                    
                    <div className='post__side'>
                        <div className="post-header">
                            <div className='profile-card'>
                            <img src={post?.photoUrl || Placeholder} alt={post?.displayName} />
                            </div>
                            <div className='header__title'>
                                <h2 onClick={()=> navigate(`/profile?userId=${post.uid}`)}>{post?.displayName}</h2>
                                <span>{formatTimestamp(post?.timestamp)}</span>
                                </div>
                                </div>
                                {post.post && (
                                <div className='post__content'>
   
                                    <div className='post-text'>
                                        <p>{post?.post}</p>
                                    </div>
                                </div>
                            )}
                                <div className='post__comment-container'>
                                    <PostsComment postKey={post?.postKey} type={post?.type} uid={post?.uid} />
                                    </div>

                                    </div>
                                    </div>
                                </ClickAwayListener>       
            </div>
        </div>
    </div>
  )
}

export default FullscreenPost