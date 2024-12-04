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
  const date = new Date(timestamp);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day}/${month}/${year} at ${hours}:${minutes} ${ampm}`;
}
  return (
    <div className='post__fullscreen'>

        <div className='post-f'>
            <img id="close-button" src={CloseButton}  onClick={handleClick} alt="close menu"/>
            <div className='post-content-f'>
            <ClickAwayListener onClickAway={handleClick}>  
            <div className='post__fs'>
                <div className='image-container'>
                    <img src={post.imageUrl} alt='post-image' />
                    </div>
                    
                    <div className='post__side'>
                        <div className="post-header">
                            <img src={post.photoUrl || Placeholder} alt={post.displayName} />
                            <div className='header__title'>
                                <h2 onClick={()=> navigate(`/home/profile?userId=${post.uid}`)}>{post.displayName}</h2>
                                <span>{formatTimestamp(post.timestamp)}</span>
                                </div>
                                </div>
                                {post.post && (
                                <div className='post__content'>
   
                                    <div className='post-text'>
                                        <p>{post.post}</p>
                                    </div>
                                </div>
                            )}
                                <div className='post__comment-container'>
                                    <PostsComment postKey={post.postKey} type={post.type} uid={post.uid} />
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