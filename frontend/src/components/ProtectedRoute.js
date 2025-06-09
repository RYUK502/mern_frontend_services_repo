// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

function getRole() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!localStorage.getItem('jwt');
}

const ProtectedRoute = ({ children, requiredRole }) => {
  const authed = isAuthenticated();
  const role = getRole();

  if (!authed) {
    return <Navigate to="/login" />;
  }
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" />;
  }
  return children;
};

export default ProtectedRoute;