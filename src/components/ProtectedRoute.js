import React from 'react'
import { Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

export default function ProtectedRoute ({ children }) {

    const { currentUser } = useAuth();

    return currentUser ? <Navigate replace to="/home" /> : children;
  
}
