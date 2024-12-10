import React, { useRef, useState, useEffect } from 'react'
import { db } from '../firebase';
import { ref, get } from "firebase/database";
import { useAuth } from './contexts/AuthContext';
import { TextField, ThemeProvider, createTheme } from '@mui/material';
import Placeholder from './images/profile-placeholder-2.jpg';
import { useNavigate } from 'react-router-dom';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';

const theme = createTheme({
  components: {
    MuiInputLabel: {
      styleOverrides: {
        "root": {
          "&.Mui-focused": {
            "color": "white"
          }
        }
      }
    }
  }
});

const SearchBar = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [query, setQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState(null);

  const onChangeSearch = async (e) => {
    const searchQuery = e.target.value;
    if (!searchQuery) {
        setFilteredUsers([]);
        return;
      }

    try {
      const dbRef = ref(db, 'users');
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const users = snapshot.val();
        setUserList(users);

        const filtered = Object.values(users).filter(user =>
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
      } else {
        setFilteredUsers([]);
      }
    } catch (err) {
      setError('Failed to fetch users.');
    }
  };

  return (
    <>
      <div className='input__box'>
        <ThemeProvider theme={theme}>
          <TextField
            id="filled-search"
            onChange={onChangeSearch}
            label="Search for a user"
            type="search"
            variant="filled"
            autoComplete="off" 
            sx={{
              width: '20vw',
              '& .MuiInputLabel-root': {
                fontSize: '0.8rem',
                color: 'rgb(154, 134, 253)',
                backgroundColor: 'rgb(31, 32, 38)',
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'rgb(154, 134, 253)',
                fontSize: '1rem',
              },
              '& .MuiFilledInput-root': {
                borderRadius: '7px',
                color: 'white',
                backgroundColor: 'rgb(31, 32, 38)',
              },
              '& .MuiFilledInput-underline:after': {
                borderBottom: '2px solid rgb(154, 134, 253)', 
              },
            }}
          />
        </ThemeProvider>
        {filteredUsers.length > 0 && (
      <div className='searched-container'>
        {error && <div className='error'>{error}</div>}  

            {filteredUsers.map((user, index) => (
                <div key={user.uid} className="card__container">
                    <div className='chat-details__wrapper'>
                        <div className='profile__card'>
                            <img alt='user-avatar' src={user?.photoUrl || Placeholder} />
                            </div>
                            <div className='inner-card'>
                                <h1 onClick={()=> navigate(`/profile?userId=${user.uid}`)}>{user?.displayName}</h1>
                                </div>
                                </div>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
    
    </>
  );
}

export default SearchBar;
