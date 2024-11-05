import React, { useRef, useState, useEffect } from 'react'
import { db } from '../firebase';
import { ref, query, orderByChild, onValue } from "firebase/database";
import { useAuth } from './contexts/AuthContext';
import SearchList from './SearchList';

const SearchUser = () => {


    const searchUserRef = useRef();
    const { currentUser } = useAuth();
    const[userList, setUserList] = useState();
    const [user, setUser] = useState();
    const [error, setError] = useState();


<<<<<<< HEAD
    const searchUserByID = async () => {;
=======
    const searchUserByID = async () => {
>>>>>>> 58f1642 (group chat path added)
        const dbRef = ref(db, 'users');
        const arr = [];
        const searchValue = document.getElementById("search-user__box").value;
        // console.log(searchValue);

onValue(dbRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
        const childKey = childSnapshot.key;
        const childData = childSnapshot.val();

        if (childKey !== currentUser.uid && childData.displayName === searchValue) {
            arr.push(childData);
<<<<<<< HEAD

=======
>>>>>>> 58f1642 (group chat path added)
        }
    })
    setUserList(arr);
}, {
    onlyOnce: true
})

// console.log(user)
}

  return (
    <div className='search-user__container'>
        <h1> SEARCH FOR  A USER </h1>

    <div className='search-form__container'>
        <input id="search-user__box" type="text" ref={searchUserRef}name="search-bar" />
        <button onClick={searchUserByID}> Search </button>
    </div>


     {userList && userList.map((data, key) => (
        <SearchList results={data} key={key}/>
     ))
    }



 


    </div>
  )
}

export default SearchUser