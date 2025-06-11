// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UserPage from './pages/UserPage'; // Now using the new, normal CSS-based UserPage
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage'; // you will create this later
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = React.useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWithRedirect />} />
        <Route path="/register" element={<RegisterWithRedirect />} />
        <Route
          path=":username"
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

// Wrapper to inject navigation into LoginPage
function LoginWithRedirect() {
  const navigate = useNavigate();
  const handleLoginSuccess = (role, username) => {
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate(`/${username}`);
    }
  };

  return (
    <LoginPage
      onLoginSuccess={handleLoginSuccess}
      onSwitchToRegister={() => navigate('/register')}
    />
  );
}

// Wrapper to inject navigation into RegisterPage
function RegisterWithRedirect() {
  const navigate = useNavigate();
  return <RegisterPage onSwitchToLogin={() => navigate('/login')} />;
}

export default App;