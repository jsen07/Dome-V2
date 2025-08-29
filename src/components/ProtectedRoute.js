import React from "react";
import { Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  // console.log(currentUser);

  // return currentUser ? <Navigate replace to="/home" /> : children;
  return currentUser && currentUser.emailVerified ? (
    <Navigate replace to="/home" />
  ) : (
    children
  );
}
