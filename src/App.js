import "./styles/style.css";
import "react-image-crop/src/ReactCrop.scss";
import React, { useEffect } from "react";
import Login from "./components/Login";
import { AuthProvider } from "./components/contexts/AuthContext";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import GroupchatRoute from "./components/GroupchatRoute";
import { useStateValue } from "./components/contexts/StateProvider";
import Chat from "./components/Chat";
import ChatList from "./components/ChatList";
import Profile from "./components/Profile";
import ChatRoute from "./components/ChatRoute";
import GroupChat from "./components/GroupChat";
import Posts from "./components/Posts";
import HomeNav from "./components/HomeNav";
import { db } from "./firebase";
import { child, get, serverTimestamp } from "firebase/database";
import Header from "./components/Header";

function App() {
  const [{ user }] = useStateValue();

  useEffect(() => {
    if (user) {
      const db_ref = db.ref();
      get(child(db_ref, `users/${user.uid}`)).then((snapshot) => {
        if (!snapshot.exists()) {
          db_ref.child("users/" + user.uid).set({
            photoUrl: "",
            displayName: user.displayName,
            Bio: "",
            Gender: "Prefer not to say",
            email: user.email,
            uid: user.uid,
            joined: serverTimestamp(),
          });
        }
      });
    }
  }, [user]);

  return (
    <div className="w-full bg-neutral-950 relative min-h-screen flex flex-col md:items-center">
      <div className="w-full flex flex-col pb-20 md:max-w-3xl ">
        {/* <div className="fixed top-0 left-0 z-40 bg-black text-white text-base px-10 py-1 rounded-br">
          <div className="hidden 2xl:block">2XL</div>
          <div className="block sm:hidden">XS</div>
          <div className="hidden sm:block md:hidden">SM</div>
          <div className="hidden md:block lg:hidden">MD</div>
          <div className="hidden lg:block xl:hidden">LG</div>
          <div className="hidden xl:block 2xl:hidden">XL</div>
        </div> */}
        <Router>
          <AuthProvider>
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
                      {/* <Sidebar/> */}
                      {/* <HomeNav /> */}
                      {/* <ChatList /> */}
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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </div>
    </div>
  );
}

export default App;
