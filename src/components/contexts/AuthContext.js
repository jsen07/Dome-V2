import React, { useContext, useEffect, useState } from 'react'
import { auth } from '../../firebase';
import { actionTypes } from '../../reducers/userReducer';
import { useStateValue } from "./StateProvider";
import { db } from '../../firebase';
import { child, get } from "firebase/database";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);
    const [{user}, dispatch] = useStateValue();

    function signUp( email, password, displayname) {
        
        auth.createUserWithEmailAndPassword(email, password).then((result) => {

            auth.signOut().then(() => {
                const db_ref = db.ref();
                get(child(db_ref, `users/${result.user.uid}`)).then((snapshot) => {
                  if (!snapshot.exists()) {
                    db_ref.child('users/' + result.user.uid).set({
                      photoUrl: "",
                      displayName: displayname,
                      Bio: "",
                      Gender: "Prefer not to say",
                      email: email,
                      uid: result.user.uid
                    })
                  }
                })
            })

            return result.user.updateProfile({ displayName: displayname });
        }).catch(function(error) {console.log(error)});


    }

    function login(email, password) {

        return auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
            const userDetails = userCredential.user;

            const userStatusRef = db.ref(`status/${userDetails.uid}`);
            userStatusRef.onDisconnect().set('offline');
            userStatusRef.set('online');

            return userDetails;
        }).catch((error) => {
            alert(error.message)
        });

    }

    function logout() {
        return auth.signOut().then(() => {
            if(currentUser) {
                db.ref(`status/${currentUser.uid}`).set('offline');
            }
        });
    }

useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged( user => {
        setCurrentUser(user)
        dispatch({
            type: actionTypes.SET_USER,
            user: user,
            isLoading: false
          })
        setLoading(false);

        if (user) {
            // Set the user's status to online when they re-enter the app
            const userStatusRef = db.ref(`status/${user.uid}`);
            userStatusRef.onDisconnect().set('offline');
            userStatusRef.set('online');
        }

    });

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
