import './styles/style.css';
import Login from './components/Login';
import Home from './components/Home';
import { AuthProvider } from './components/contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { useStateValue } from './components/contexts/StateProvider';
import Chat from './components/Chat';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatRoute from './components/ChatRoute';

function App() {

  const [{isLoading, user}] = useStateValue();

  return (
    <div className="home">

{isLoading &&(
      <div className='loading'> LOADING... </div>
    )}

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
                    <Chat />
                    </ChatRoute>
                </PrivateRoute>
            } />
            <Route path="/home" element={
                <PrivateRoute>
                    
                    <Home />
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
