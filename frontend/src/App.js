import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LoginPage   from './pages/LoginPage';
import SignupPage  from './pages/SignupPage';
import HomePage    from './pages/HomePage';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProductPage from './pages/ProductPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ChatbotWidget from './components/ChatbotWidget';

import { logoutUser } from './api/api';

import ProductDescription from "./components/ProductDescription";

// ── Persist cart to localStorage ──────────────────────────────────────────────
function loadCart() {
  try {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCartState] = useState(loadCart);
  const [chatOpen, setChatOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // Wrap setCart to also persist to localStorage
  const setCart = (updater) => {
    setCartState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('cart', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
    } catch (err) {
      console.warn("Logout failed on server, clearing anyway", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear cart on logout
      localStorage.removeItem('cart');
      setCartState([]);
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
      <button
        className="dark-toggle"
        onClick={() => setDarkMode(d => !d)}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {user?.role === 'customer' && (
        <ChatbotWidget open={chatOpen} onToggle={() => setChatOpen(o => !o)} />
      )}
      <Routes>

        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Login */}
        <Route
          path="/login"
          element={
            !user ? <LoginPage onLogin={handleLogin} /> :
            user.role === 'seller' ? <Navigate to="/seller" /> :
            user.role === 'admin'  ? <Navigate to="/admin"  /> :
            <Navigate to="/home" />
          }
        />

        {/* Signup */}
        <Route
          path="/signup"
          element={
            !user ? <SignupPage onLogin={handleLogin} /> :
            user.role === 'seller' ? <Navigate to="/seller" /> :
            user.role === 'admin'  ? <Navigate to="/admin"  /> :
            <Navigate to="/home" />
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

        {/* Product Detail */}
        <Route
          path="/product/:id"
          element={
            user ? (
              <ProductPage user={user} cart={cart} setCart={setCart} />
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

        <Route
          path="/admin"
          element={
            user ? (
              user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/home" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

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
          path="/checkout"
          element={
            user ? (
              <CheckoutPage setCart={setCart} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/search"
          element={
            user ? (
              <SearchResultsPage cart={cart} setCart={setCart} />
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
