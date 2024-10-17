import React, { useContext, useEffect, useState } from 'react'
import { auth } from '../../firebase';
import { actionTypes } from '../../reducers/userReducer';
import { useStateValue } from "./StateProvider";


const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);
    const [{user}, dispatch] = useStateValue();

    function signUp( email, password, displayname) {
        
        auth.createUserWithEmailAndPassword(email, password).then(function(result) {

            logout();
            return result.user.updateProfile({ displayName: displayname });
        }).catch(function(error) {console.log(error)});


    }

    function login(email, password) {

        return auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
            const userDetails = userCredential.user;
            dispatch({
                type: actionTypes.SET_USER,
                user: userDetails
              })
            return userDetails;
        }).catch((error) => {
            alert(error.message)
        });

    }

    function logout() {
        return auth.signOut();
    }

useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged( user => {
        setCurrentUser(user)
        setLoading(false);
    })

    return unsubscribe
}, [])

    const value = {
        currentUser,
        signUp,
        login,
        logout
    }
  return (
    <AuthContext.Provider value={value}>
        {!loading && children}
    </AuthContext.Provider>
  )
}
