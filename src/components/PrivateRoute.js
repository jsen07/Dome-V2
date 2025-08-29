import React from "react";
import { Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // console.log(currentUser);

  // return currentUser ? children : <Navigate replace to="/" />;
  return currentUser && currentUser.emailVerified ? (
    children
  ) : (
    <Navigate replace to="/" />
  );
}
