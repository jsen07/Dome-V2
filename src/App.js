import './styles/style.css';
import React, { useEffect } from 'react'
import Login from './components/Login';
import Home from './components/Home';
import { AuthProvider } from './components/contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import ProtectedRoute from './components/ProtectedRoute';
import GroupchatRoute from './components/GroupchatRoute';
import { useStateValue } from './components/contexts/StateProvider';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import Profile from './components/Profile';
import ChatRoute from './components/ChatRoute';
import GroupChat from './components/GroupChat';
import Posts from './components/Posts';
import { db } from './firebase';
import { child, get, serverTimestamp } from "firebase/database";

function App() {

  const [{ user}] = useStateValue();

  useEffect(() =>{
  
    if(user) {
      
      
      const db_ref = db.ref();
      get(child(db_ref, `users/${user.uid}`)).then((snapshot) => {
        if (!snapshot.exists()) {
          db_ref.child('users/' + user.uid).set({
            photoUrl: "",
            displayName: user.displayName,
            Bio: "",
            Gender: "Prefer not to say",
            email: user.email,
            uid: user.uid,
            joined: serverTimestamp()
          })
        }
      })
    }
    
    
    },[user]);

  return (
    <div className="home">

<Router>
<AuthProvider>
        <Routes>
            <Route path="/" element={
                <ProtectedRoute>
                    <Login />
                </ProtectedRoute>
            } />
            <Route path="/home/:chatId" element={
                <PrivateRoute>
                      <ChatRoute>
                  <Sidebar/>
                  <ChatList />
                    <Chat />
                    </ChatRoute>
                </PrivateRoute>
            } />
                <Route path="/home/groupchat/:chatId" element={
                <PrivateRoute>
                      <GroupchatRoute>
                  <Sidebar/>
                  <ChatList />
                    <GroupChat />
                    </GroupchatRoute>
                </PrivateRoute>
            } />
            <Route path="/home" element={
                <PrivateRoute>
                        <Sidebar/>
                        <ChatList />
                        <Posts />

                </PrivateRoute>
            } />

<Route path="/home/profile" element={
                <PrivateRoute>
                        <Sidebar/>
                        <Profile />
                </PrivateRoute>
            } />

<Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
        </Router>
        </div>
    )
}

export default App;
