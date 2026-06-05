import axios from 'axios'

/**
 * Axios Instance - SmartLMS API Client
 *
 * Features:
 * 1. Base URL: /api (Vite proxy se Spring Boot pe jayega)
 * 2. JWT Interceptor: Har request me automatically Authorization header add
 * 3. Response Interceptor: 401 par auto-logout
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
})

// ---- REQUEST INTERCEPTOR: JWT Token auto-attach ----
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartlms_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---- RESPONSE INTERCEPTOR: 401 → auto logout ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired ya invalid → clear karo aur login pe bhejo
      localStorage.removeItem('smartlms_token')
      localStorage.removeItem('smartlms_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
