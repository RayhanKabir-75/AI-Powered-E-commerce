import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000/api/' });

// Attach token to every request automatically
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log("TOKEN BEING SENT:", token);

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const registerUser = (data) => API.post('auth/register/', data);
export const loginUser    = (data) => API.post('auth/login/', data);
export const logoutUser   = ()     => API.post('auth/logout/');
export const getProfile   = ()     => API.get('auth/profile/');
export const forgotPassword = (data) =>
  API.post('auth/forgot-password/', data);
export const resetPassword = (uid, token, data) =>
  API.post(`auth/reset-password/${uid}/${token}/`, data);

// ── Products ──────────────────────────────────────────
export const getProducts         = (params) => API.get('products/', { params });
export const getProduct          = (id)     => API.get(`products/${id}/`);
export const createProduct       = (data)   => API.post('products/', data);
export const generateDescription = (data)   => API.post('products/generate-description/', data);

// ── Chatbot ───────────────────────────────────────────
export const chatbotSend = (data) => API.post('chatbot/', data);

export default API;