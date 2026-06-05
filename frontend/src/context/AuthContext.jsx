import { createContext, useContext, useState, useEffect } from 'react'

/**
 * Auth Context - JWT token aur user state manage karna
 *
 * Provides:
 * - user: { email, name, role, collegeId, collegeName }
 * - token: JWT string
 * - login(authResponse): token save + user set
 * - logout(): sab clear karo
 * - isAuthenticated: boolean
 * - isAdmin: boolean (FACULTY_ADMIN check)
 * - isStudent: boolean (STUDENT check)
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // App load hone par localStorage se user restore karo
  useEffect(() => {
    const savedToken = localStorage.getItem('smartlms_token')
    const savedUser = localStorage.getItem('smartlms_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  // Login - Backend se AuthResponse aane ke baad call hota hai
  const login = (authResponse) => {
    const { token, email, name, role, collegeId, collegeName } = authResponse
    const userData = { email, name, role, collegeId, collegeName }

    localStorage.setItem('smartlms_token', token)
    localStorage.setItem('smartlms_user', JSON.stringify(userData))
    setToken(token)
    setUser(userData)
  }

  // Logout - Sab kuch clear karo
  const logout = () => {
    localStorage.removeItem('smartlms_token')
    localStorage.removeItem('smartlms_user')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'FACULTY_ADMIN',
    isStudent: user?.role === 'STUDENT',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook - components me easy use ke liye
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
