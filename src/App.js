import "react-image-crop/src/ReactCrop.scss";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { AuthProvider, useAuth } from "./components/contexts/AuthContext";
import { useUserProfile } from "./components/hooks/useUserProfile";
import { setActiveUser } from "./components/store/userSlice";
import { useDispatch } from "react-redux";

import PrivateRoute from "./components/PrivateRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import GroupchatRoute from "./components/GroupchatRoute";
import ChatRoute from "./components/ChatRoute";
import VerifiedRoute from "./components/VerifiedRoute";

import Login from "./components/Login";
import VerifyEmail from "./components/VerifyEmail";
import GroupChat from "./components/GroupChat";
import Chat from "./components/Chat";
import ChatList from "./components/ChatList";
import Profile from "./components/Profile";
import Posts from "./components/Posts";
import UploadPost from "./components/UploadPost";
import Header from "./components/Header";
import HomeNav from "./components/HomeNav";
import Notifications from "./components/Notifications";
import OnMountAnimation from "./components/OnMountAnimation";

function AppContent() {
  const { currentUser } = useAuth();
  const { userDetails, error } = useUserProfile(currentUser?.uid || null);
  const [showSplash, setShowSplash] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentUser) {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  useEffect(() => {
    if (userDetails && currentUser) {
      if (userDetails.uid === currentUser.uid) {
        if (localStorage.getItem("userSlice")) return;
        dispatch(setActiveUser(userDetails));
      }
    }
  }, [currentUser, userDetails]);

  if (showSplash) {
    return (
      <OnMountAnimation duration={2000} onFinish={() => setShowSplash(false)} />
    );
  }

  return (
    <div className="w-full bg-neutral-950 relative flex flex-col sm:items-center">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        limit={1}
      />
      <div className="w-full flex flex-col pb-20 min-h-screen sm:max-w-xl">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Login />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <ProtectedRoute>
                <VerifiedRoute>
                  <VerifyEmail />
                </VerifiedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/groupchat/:chatId"
            element={
              <PrivateRoute>
                <GroupchatRoute>
                  <GroupChat />
                </GroupchatRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Header />
                <Posts />
                <HomeNav />
                {/* <Notifications /> */}
                {/* <OnMountAnimation
                  duration={2000}
                  onFinish={() => setShowSplash(false)}
                /> */}
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Notifications />
                <HomeNav />
              </PrivateRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <PrivateRoute>
                <Header />
                <ChatList />
                <HomeNav />
              </PrivateRoute>
            }
          />
          <Route
            path="/chats/:chatId"
            element={
              <PrivateRoute>
                <ChatRoute>
                  <Chat />
                </ChatRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <HomeNav />
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/post-upload"
            element={
              <PrivateRoute>
                <Header />
                <UploadPost />
                <HomeNav />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
