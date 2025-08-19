import React, { useContext, useEffect, useState } from "react";
import { auth } from "../../firebase";
import { actionTypes } from "../../reducers/userReducer";
import { useStateValue } from "./StateProvider";
import { db } from "../../firebase";
import { serverTimestamp } from "firebase/database";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const [{ user }, dispatch] = useStateValue();

  // add device ID to localStorage
  const deviceId = React.useMemo(() => {
    let storedId = localStorage.getItem("deviceKey");
    if (!storedId) {
      storedId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem("deviceKey", storedId);
    }
    return storedId;
  }, []);

  const setOnlineStatus = async (userId, isOnline) => {
    if (!userId) return;

    const userStatusRef = db.ref(`status/${userId}/${deviceId}`);

    if (isOnline) {
      // check if this device ID already exists for the user
      const snapshot = await userStatusRef.get();
      if (!snapshot.exists()) {
        await userStatusRef.set({
          state: "Online",
          lastChanged: serverTimestamp(),
        });
      } else {
        // update state if it already exists
        await userStatusRef.update({
          state: "Online",
          lastChanged: serverTimestamp(),
        });
      }

      // on disconnect
      userStatusRef.onDisconnect().remove();
    } else {
      await userStatusRef.remove();
    }
  };

  const signUp = (email, password, displayname) => {
    auth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        auth.signOut().then(() => {
          const db_ref = db.ref();
          db_ref
            .child("users/" + result.user.uid)
            .get()
            .then((snapshot) => {
              if (!snapshot.exists()) {
                db_ref.child("users/" + result.user.uid).set({
                  photoUrl: "",
                  displayName: displayname,
                  Bio: "",
                  Gender: "Prefer not to say",
                  email: email,
                  uid: result.user.uid,
                  joined: serverTimestamp(),
                });
              }
            });
        });
        return result.user.updateProfile({ displayName: displayname });
      })
      .catch((error) => console.log(error));
  };

  const login = async (email, password) => {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    const userDetails = userCredential.user;
    await setOnlineStatus(userDetails.uid, true);
    return userDetails;
  };

  const logout = async () => {
    if (currentUser) await setOnlineStatus(currentUser.uid, false);
    return auth.signOut();
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      dispatch({
        type: actionTypes.SET_USER,
        user: user,
        isLoading: false,
      });
      setLoading(false);

      if (user) setOnlineStatus(user.uid, true);
    });

    return unsubscribe;
  }, [deviceId]);

  useEffect(() => {
    if (!currentUser) return;

    let offlineTimer = null;

    const goOnline = () => {
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
      setOnlineStatus(currentUser.uid, true);
    };

    const goOfflineWithDelay = () => {
      if (offlineTimer) clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => {
        setOnlineStatus(currentUser.uid, false);
      }, 60000); // 1 min delay before going offline
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        goOnline();
      } else {
        goOfflineWithDelay();
      }
    };

    // Exit App Scenarios
    const handlePageHide = () => {
      goOfflineWithDelay();
    };

    const handleBeforeUnload = () => {
      // If leaving the page completely go offline immediately
      goOfflineWithDelay();
    };

    //visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // when app/tab is backgrounded
    window.addEventListener("pagehide", handlePageHide);

    // leaving the page
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Go online when mounted
    goOnline();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (offlineTimer) clearTimeout(offlineTimer);
    };
  }, [currentUser, deviceId]);

  const value = { currentUser, signUp, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
