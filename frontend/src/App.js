import React, { useState, useEffect, useRef } from 'react';
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
import WishlistPage from './pages/WishlistPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ChatbotWidget from './components/ChatbotWidget';

import { setupAutoLogout } from "./utils/autoLogout";

import { logoutUser, getWishlist, toggleWishlist, getCart, syncCart } from './api/api';

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

function serverItemToCart(item) {
  return {
    id:           item.product_id,
    cartKey:      `${item.product_id}_${item.variant_id || 0}`,
    name:         item.product_name,
    price:        item.price,
    qty:          item.quantity,
    image:        item.product_image,
    cat:          item.category_name,
    variant_id:   item.variant_id   || null,
    variant_name: item.variant_name || null,
  };
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCartState] = useState(loadCart);
  const [chatOpen, setChatOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const syncTimerRef = useRef(null);

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
      const userData = JSON.parse(savedUser);
      setUser(userData);
      if (userData.role === 'customer') {
        getCart()
          .then(res => {
            if (res.data.length > 0) {
              setCartState(res.data.map(serverItemToCart));
            }
          })
          .catch(() => {});
      }
    }

    setLoading(false);
  }, []);

  // Sync login/logout across tabs for concurrent sessions
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'user' || event.key === 'token') {
        const savedUser  = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
          setCartState([]);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  //loogout after 15 mins of inactivity
  useEffect(() => {
    setupAutoLogout(() => {
    localStorage.removeItem("token");
    alert("Session expired due to inactivity");
    window.location.href = "/login";
    });
  }, []);


  // Debounced sync of cart to server whenever it changes
  useEffect(() => {
    if (!user || user.role !== 'customer') return;
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const items = cart.map(item => ({
        product_id: item.id,
        variant_id: item.variant_id || null,
        quantity:   item.qty,
      }));
      syncCart(items).catch(() => {});
    }, 600);
    return () => clearTimeout(syncTimerRef.current);
  }, [cart, user]);

  // Load wishlist IDs whenever a customer logs in
  useEffect(() => {
    if (user?.role === 'customer') {
      getWishlist()
        .then(res => setWishlistIds(new Set(res.data.map(item => item.product.id))))
        .catch(() => {});
    } else {
      setWishlistIds(new Set());
    }
  }, [user]);

  const handleToggleWishlist = async (productId) => {
    try {
      const res = await toggleWishlist(productId);
      setWishlistIds(prev => {
        const next = new Set(prev);
        res.data.added ? next.add(productId) : next.delete(productId);
        return next;
      });
    } catch {}
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData.role === 'customer') {
      getCart()
        .then(res => {
          if (res.data.length > 0) {
            setCartState(res.data.map(serverItemToCart));
          }
        })
        .catch(() => {});
    }
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
        <ChatbotWidget open={chatOpen} onToggle={() => setChatOpen(o => !o)} setCart={setCart} />
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
              user.role === 'seller' ? <Navigate to="/seller" /> : (
                <HomePage
                  user={user} onLogout={handleLogout}
                  cart={cart} setCart={setCart}
                  wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist}
                />
              )
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
              <ProductPage
                user={user} cart={cart} setCart={setCart}
                wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist}
              />
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
              <SearchResultsPage
                cart={cart} setCart={setCart}
                wishlistIds={wishlistIds} onToggleWishlist={handleToggleWishlist}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Wishlist */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route
          path="/wishlist"
          element={
            user ? (
              <WishlistPage
                cart={cart} setCart={setCart}
                wishlist={wishlistIds} onToggle={handleToggleWishlist}
              />
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
