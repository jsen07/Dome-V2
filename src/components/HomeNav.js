import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from './contexts/AuthContext';
import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ForumIcon from '@mui/icons-material/Forum';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Diversity1OutlinedIcon from '@mui/icons-material/Diversity1Outlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import  logo  from './svg/logo-transparent-cropped-png.png';

const HomeNav = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const [activeLink, setActiveLink] = useState(''); 



  // useEffect(()=> {
  //   handleLinkClick('home');
  // },[])
  const handleLinkClick = (link) => {
    setActiveLink(link);  
  };

  const handleLogout = async () => {
    try {
        await logout();
        alert('You\'ve been logged out');
        navigate("/");
    } catch (error) {
        console.error("Logout failed: ", error);
    }
};

  return (
    <div className='navigation-panel__container'>

<div className='nav__top'>
<img src={logo} alt="logo" />

  {/* <h1>General</h1> */}


  <div className='icon-wrapper'>
      <div className={`links ${activeLink === 'home' ? 'active' : ''}`} 
      onClick={()=> {
        handleLinkClick('home');
        navigate('/home');
      }
    }><div className={`line ${activeLink === 'home' ? 'active' : ''}`}></div>
    {activeLink === 'home' ? (
       <HomeIcon className='nav-icons' />
      ) : (
        <HomeOutlinedIcon className='nav-icons'/>
)}
        {/* <h2> Home </h2> */}
      </div>
</div>


<div className='icon-wrapper'>
      <div className={`links ${activeLink === 'search' ? 'active' : ''}`} 
      onClick={()=> {
        handleLinkClick('search');
        // navigate('/home');
      }}>
      <div className={`line ${activeLink === 'search' ? 'active' : ''}`}></div>
      {activeLink === 'search' ? (
       <PersonSearchIcon className='nav-icons' />
      ) : (
        <PersonSearchOutlinedIcon className='nav-icons' />
)}

        {/* <h2> Search </h2> */}
      </div>
</div>

<div className='icon-wrapper'>
      <div className={`links ${activeLink === 'notifications' ? 'active' : ''}`} 
      onClick={()=> {
        handleLinkClick('notifications');
        // navigate('/home');
      }}>
      <div className={`line ${activeLink === 'notifications' ? 'active' : ''}`}></div>
      {activeLink === 'notifications' ? (
       <NotificationsIcon className='nav-icons' />
      ) : (
        <NotificationsNoneOutlinedIcon className='nav-icons' />
)}
        {/* <h2> Notifications </h2> */}
      </div>
</div>
 
<div className='icon-wrapper'>
      <div className={`links ${activeLink === 'profile' ? 'active' : ''}`}       
      onClick={()=> {
        handleLinkClick('profile'); 
        navigate(`/profile?userId=${currentUser.uid}`)
      }
    }>
      <div className={`line ${activeLink === 'profile' ? 'active' : ''}`}></div>
      {activeLink === 'profile' ? (
       <PersonIcon className='nav-icons' />
      ) : (
      <PersonOutlineOutlinedIcon className='nav-icons' />
)}
        {/* <h2> Profile </h2> */}
      </div>
</div>


<div className='icon-wrapper'>
      <div className={`links ${activeLink === 'friends' ? 'active' : ''}`}       
      onClick={()=> {
        handleLinkClick('friends'); 
        // navigate(`/profile?userId=${currentUser.uid}`)
      }}>
      <div className={`line ${activeLink === 'friends' ? 'active' : ''}`}></div>
      <Diversity1OutlinedIcon className='nav-icons'/>
        {/* <h2> Friends </h2> */}
      </div>
</div>


<div className='icon-wrapper'>
      <div className={`links ${activeLink === 'chats' ? 'active' : ''}`}       
      onClick={()=> {
        handleLinkClick('chats'); 
        navigate(`/chats`)
      }}>
      <div className={`line ${activeLink === 'chats' ? 'active' : ''}`}></div>
      {activeLink === 'chats' ? (
       <ForumIcon className='nav-icons' />
      ) : (
        <ForumOutlinedIcon className='nav-icons'/>
)}
        {/* <h2> Chats </h2> */}
      </div>
</div>
</div>
      <div className='links'>
      <LogoutOutlinedIcon 
      sx={{ fontSize: 40 }} id='logout-icon'
      className='nav-icons'
      onClick={handleLogout} />
      </div>
 
 
    
      

    </div>
  )
}

export default HomeNav