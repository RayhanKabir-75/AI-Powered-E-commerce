import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage   from './pages/LoginPage';
import SignupPage  from './pages/SignupPage';
import HomePage    from './pages/HomePage';
import { logoutUser } from './api/api';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const savedUser  = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

const handleLogout = async () => {
  try {
    // Call the API to delete the token on the server
    await logoutUser(); 
    console.log("Logged out from server successfully");
  } catch (err) {
    // If something fails, still clear local data
    console.warn("Logout failed on server, clearing anyway", err);
  } finally {
    // Clear local storage and React state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }
};

useEffect(() => {
  fetch('http://localhost:8000/api/auth/csrf/', {
    credentials: 'include',
  });
}, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            !user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/home" />
          }
        />

        <Route
          path="/signup"
          element={
            !user ? <SignupPage onLogin={handleLogin} /> : <Navigate to="/home" />
          }
        />

        <Route
          path="/home"
          element={
            user ? (
              <HomePage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* ✅ FIXED LOCATION */}
        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPasswordPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}