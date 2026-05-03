import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LoginPage   from './pages/LoginPage';
import SignupPage  from './pages/SignupPage';
import HomePage    from './pages/HomePage';
import SellerDashboard from './pages/SellerDashboard';
import CartPage from './pages/CartPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import { logoutUser } from './api/api';

// IMPORT YOUR COMPONENT
import ProductDescription from "./components/ProductDescription";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]); 

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
      await logoutUser(); 
      console.log("Logged out from server successfully");
    } catch (err) {
      console.warn("Logout failed on server, clearing anyway", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // CSRF setup
  useEffect(() => {
    fetch('http://localhost:8000/api/auth/csrf/', {
      credentials: 'include',
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>

        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Login */}
        <Route
          path="/login"
          element={
            !user ? <LoginPage onLogin={handleLogin} /> : user.role === 'seller' ? <Navigate to="/seller" /> : <Navigate to="/home" />
          }
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={
            !user ? <SignupPage onLogin={handleLogin} /> : user.role === 'seller' ? <Navigate to="/seller" /> : <Navigate to="/home" />
          }
        />

        {/* Home */}
        <Route
          path="/home"
          element={
            user ? (
              user.role === 'seller' ? <Navigate to="/seller" /> : <HomePage user={user} onLogout={handleLogout} cart={cart} setCart={setCart} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/seller"
          element={
            user ? (
              user.role === 'seller' ? <SellerDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/home" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/*NEW ROUTE: PRODUCT DESCRIPTION */}
        <Route
          path="/generate-description"
          element={
            user ? (
              <ProductDescription />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Reset Password */}
        <Route
          path="/cart"
          element={
            user ? (
              <CartPage cart={cart} setCart={setCart} user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/reset-password/:uid/:token"
          element={<ResetPasswordPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}