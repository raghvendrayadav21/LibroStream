import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'

// Public Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CollegeSetupWizard from './pages/CollegeSetupWizard'

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard'
import LibraryCard from './pages/student/LibraryCard'
import MyBooks from './pages/student/MyBooks'
import Penalties from './pages/student/Penalties'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import QRScanner from './pages/admin/QRScanner'
import BookInventory from './pages/admin/BookInventory'
import Transactions from './pages/admin/Transactions'
import CollegeSettings from './pages/admin/CollegeSettings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--bg-border)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Routes>
          {/* ===== PUBLIC ROUTES ===== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/college/register" element={<CollegeSetupWizard />} />

          {/* ===== STUDENT ROUTES (STUDENT role required) ===== */}
          <Route element={<PrivateRoute requiredRole="STUDENT" />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/card" element={<LibraryCard />} />
            <Route path="/student/books" element={<MyBooks />} />
            <Route path="/student/penalties" element={<Penalties />} />
          </Route>

          {/* ===== ADMIN ROUTES (FACULTY_ADMIN role required) ===== */}
          <Route element={<PrivateRoute requiredRole="FACULTY_ADMIN" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/scan" element={<QRScanner />} />
            <Route path="/admin/books" element={<BookInventory />} />
            <Route path="/admin/transactions" element={<Transactions />} />
            <Route path="/admin/settings" element={<CollegeSettings />} />
          </Route>

          {/* ===== FALLBACK ===== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
