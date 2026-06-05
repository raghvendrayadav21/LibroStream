import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * PrivateRoute - Role-based route protection
 *
 * Usage:
 * <Route element={<PrivateRoute requiredRole="STUDENT" />}>
 *   <Route path="/student/dashboard" element={<StudentDashboard />} />
 * </Route>
 *
 * - requiredRole: "STUDENT" | "FACULTY_ADMIN" | null (sirf login check)
 * - Agar login nahi → /login pe redirect
 * - Agar wrong role → /unauthorized pe redirect
 */
export default function PrivateRoute({ requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth()

  // Auth state load ho rahi hai — kuch mat dikhao abhi
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-base)'
      }}>
        <div style={{ textAlign: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading SmartLMS...</p>
        </div>
      </div>
    )
  }

  // Login nahi hai
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Role check (agar requiredRole pass kiya gaya hai)
  if (requiredRole && user?.role !== requiredRole) {
    // Wrong role — unke dashboard pe bhejo
    if (user?.role === 'STUDENT') return <Navigate to="/student" replace />
    if (user?.role === 'FACULTY_ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to="/login" replace />
  }

  // Sab theek hai — nested routes render karo
  return <Outlet />
}
