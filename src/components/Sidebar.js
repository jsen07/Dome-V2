import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import Profile from './Profile';
import SearchUser from './SearchUser';
import ChatList from './ChatList';
import GroupList from './GroupList';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [activeComponent, setActiveComponent] = useState(null);
    const MemoizedChatList = React.memo(ChatList);


    const isActive = (component) => activeComponent === component;

    const handleLogout = async () => {
        try {
            await logout();
            alert('You\'ve been logged out');
            navigate("/");
        } catch (error) {
            console.error("Logout failed: ", error);
        }
    };

    const toggleProfileHandler = () => {
        setActiveComponent(prev => prev === 'profile' ? null : 'profile');
    };

    const toggleAddFriendHandler = () => {
        setActiveComponent(prev => prev === 'addFriend' ? null : 'addFriend');
    };

    return (
        <div className='home__container'>
            <div className='side-menu__bar'>
                <div className='side-bar__top'>
                    <h1 id="side-bar__header" onClick={()=> navigate('/home')}>Dome</h1>

                    <div className={`side-bar__icon ${isActive('profile') ? 'active' : ''}`} 
                         title="Profile" 
                         id="profile__icon" 
                         onClick={toggleProfileHandler} 
                         aria-label="Toggle Profile">
                    </div>
                    <div className={`side-bar__icon ${isActive('addFriend') ? 'active' : ''}`}  
                         title="Search users" 
                         id="add-friend__icon" 
                         onClick={toggleAddFriendHandler} 
                         aria-label="Search Users">
                    </div>
                </div>
                <div className='groupchat__list'>
                    <GroupList />
                </div>
                <div className='side-bar__icon' 
                     title="Logout" 
                     id="logout__icon" 
                     onClick={handleLogout} 
                     aria-label="Logout">
                </div>
            </div>

            {activeComponent === 'profile' && <Profile />}
            {activeComponent === 'addFriend' && <SearchUser />}
            {!activeComponent && (
                <div className={`chat-list-container ${activeComponent ? 'hidden' : ''}`}>
                    <MemoizedChatList />
                </div>
            )}
        </div>
    );
};

export default Sidebar;
