import React, { useContext, useEffect, useState, useCallback } from "react";
import { auth } from "../../firebase";
import { actionTypes } from "../../reducers/userReducer";
import { useStateValue } from "./StateProvider";
import { db } from "../../firebase";
import { serverTimestamp } from "firebase/database";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { setActiveUser, clearActiveUser } from "../store/userSlice";
import { useDispatch } from "react-redux";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // add device ID to localStorage
  const deviceId = React.useMemo(() => {
    let storedId = localStorage.getItem("deviceKey");
    if (!storedId) {
      storedId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem("deviceKey", storedId);
    }
    return storedId;
  }, []);

  const setOnlineStatus = useCallback(
    async (userId, isOnline) => {
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
          await userStatusRef.update({
            state: "Online",
            lastChanged: serverTimestamp(),
          });
        }

        userStatusRef.onDisconnect().remove();
      } else {
        await userStatusRef.remove();
      }
    },
    [deviceId]
  );

  const signUp = async (email, password, displayname) => {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);

      await result.user.updateProfile({ displayName: displayname });
      await result.user.sendEmailVerification();

      const db_ref = db.ref();
      const snapshot = await db_ref.child("users/" + result.user.uid).get();
      if (!snapshot.exists()) {
        await db_ref.child("users/" + result.user.uid).set({
          photoUrl: "",
          displayName: displayname,
          fullName: "",
          Bio: "",
          Gender: "Prefer not to say",
          email: email,
          uid: result.user.uid,
          joined: serverTimestamp(),
        });
      }

      navigate("/verify-email");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("This email is already registered. Please log in.");
      } else {
        toast.error("Oops, something went wrong 😅");
        console.error(error);
      }
    }
  };

  const login = async (email, password) => {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    const userDetails = userCredential.user;
    await userDetails.reload();

    if (userDetails && !userDetails.emailVerified) {
      toast.error("Please verify your email before logging in.");
      // await auth.signOut();
      navigate("/verify-email");
      setCurrentUser(userDetails);
      return null;
    }
    setCurrentUser(userDetails);
    await setOnlineStatus(userDetails.uid, true);
    return userDetails;
  };

  const resendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await user.reload();
    const refreshedUser = auth.currentUser;

    if (refreshedUser && !refreshedUser.emailVerified) {
      try {
        await refreshedUser.sendEmailVerification();
        toast.success("Verification email resent! Please check your inbox.");
        await auth.signOut();
        setCurrentUser(null);
        navigate("/");
      } catch (error) {
        toast.error(`Error resending email: ${error.message}`);
      }
    }

    if (refreshedUser && refreshedUser.emailVerified) {
      navigate("/");
      toast.info("Email has been verified. Log in.");
    }
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await setOnlineStatus(currentUser.uid, false);
      }

      await auth.signOut();
      setCurrentUser(null);
      dispatch(clearActiveUser());
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  //OLD OnAuth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if ((user && !user.emailVerified) || (user && user.emailVerified)) {
        //change to user && user.emailVerified in final
        setCurrentUser(user);

        const currentUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoUrl: user?.photoURL || null,
        };

        dispatch(setActiveUser(currentUser));

        setOnlineStatus(user.uid, true);
      } else {
        setCurrentUser(null);
        dispatch({
          type: actionTypes.SET_USER,
          user: null,
          isLoading: false,
        });
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [deviceId, dispatch, setOnlineStatus]);

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
      // If leaving the page completely go offline
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
  }, [currentUser, deviceId, setOnlineStatus]);

  const value = {
    currentUser,
    signUp,
    login,
    logout,
    resendVerificationEmail,
    setCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
