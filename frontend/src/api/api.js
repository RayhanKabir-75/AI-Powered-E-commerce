import axios from 'axios';

// ── Axios instance ──────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const mediaBase = BASE_URL.replace(/\/api\/?$/, '');
  return `${mediaBase}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ── CSRF interceptor ────────────────────────────────────
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Automatically attach CSRF token to unsafe requests
API.interceptors.request.use(config => {
  // Attach auth token if available
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Token ${token}`;

  const csrfToken = getCookie('csrftoken');
  if (csrfToken && ['post', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// ── Auth ───────────────────────────────────────────────
export const registerUser = (data) => API.post('auth/register/', data);
export const loginUser    = (data) => API.post('auth/login/', data); // no token needed
export const logoutUser   = () => API.post('auth/logout/');          // session logout
export const getProfile   = () => API.get('auth/profile/');
export const updateProfile = (data) => API.patch('auth/profile/', data);
export const forgotPassword = (data) => API.post('auth/forgot-password/', data);
export const requestPasswordReset = (email) => API.post('auth/password-reset/', { email });
export const resetPassword = (uid, token, data) =>
  API.post(`auth/reset-password/${uid}/${token}/`, data);
export const googleAuth = (data) => API.post('auth/google/', data);

// ── Products ──────────────────────────────────────────
export const getProducts = (params) => API.get('products/', { params });
export const getProduct = (id) => API.get(`products/${id}/`);
export const createProduct = (data, config) => API.post('products/', data, config);
export const updateProduct = (id, data, config) => API.patch(`products/${id}/`, data, config);
export const deleteProduct = (id) => API.delete(`products/${id}/`);
export const generateDescription  = (data) => API.post('products/generate-description/', data);
export const getRecommendations   = (limit = 8) => API.get('products/recommended/', { params: { limit } });
export const trackProductView     = (id) => API.post(`products/${id}/view/`);

// ── Orders ────────────────────────────────────────────
export const getOrders = () => API.get('orders/');
export const getOrder = (id) => API.get(`orders/${id}/`);
export const placeOrder = (data) => API.post('orders/place/', data);
export const updateOrderStatus = (id, status) => API.patch(`orders/${id}/status/`, { status });
export const cancelOrder = (id) => API.post(`orders/${id}/cancel/`);

// ── Reviews ────────────────────────────────────────────
export const getReviews = (productId) => API.get(`products/${productId}/reviews/`);
export const getReviewSummary = (productId) => API.get(`products/${productId}/reviews/summary/`);
export const submitReview = (productId, data) => API.post(`products/${productId}/reviews/`, data);
export const regenerateSummary = (productId) => API.post(`reviews/summary/${productId}/regenerate/`);

// ── Admin ─────────────────────────────────────────────
export const getAdminStats  = ()       => API.get('orders/admin/stats/');
export const getAdminOrders = (params) => API.get('orders/admin/orders/', { params });

// ── Chatbot ───────────────────────────────────────────
export const chatbotSend = (data) => API.post('chatbot/', data);

export default API;