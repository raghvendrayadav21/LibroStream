import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const studentLinks = [
  { to: '/student',          icon: '🏠', label: 'Dashboard' },
  { to: '/student/card',     icon: '🪪', label: 'My Library Card' },
  { to: '/student/books',    icon: '📚', label: 'My Books' },
  { to: '/student/penalties',icon: '⚠️', label: 'Penalties' },
]

const adminLinks = [
  { to: '/admin',            icon: '📊', label: 'Dashboard' },
  { to: '/admin/scan',       icon: '📷', label: 'Scan QR Code' },
  { to: '/admin/books',      icon: '📖', label: 'Book Inventory' },
  { to: '/admin/transactions',icon:'🔄', label: 'Transactions' },
  { to: '/admin/settings',   icon: '⚙️', label: 'College Settings' },
]

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const links = isAdmin ? adminLinks : studentLinks

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully!')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--gradient-brand)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0
        }}>📚</div>
        <div>
          <div style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800, fontSize: '1rem',
            color: 'var(--text-primary)'
          }}>SmartLMS</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {isAdmin ? '👑 Admin Panel' : '🎓 Student Portal'}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex', alignItems: 'center', gap: '0.75rem'
      }}>
        <div style={{
          width: '38px', height: '38px',
          background: 'var(--gradient-brand)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0
        }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontWeight: 600, fontSize: '0.85rem',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {user?.name}
          </div>
          <div style={{
            fontSize: '0.7rem', color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {user?.collegeName}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/student' || link.to === '/admin'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.7rem 0.875rem',
              borderRadius: '10px',
              marginBottom: '0.25rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--gradient-brand)' : 'transparent',
              boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            })}
          >
            <span style={{ fontSize: '1rem' }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--bg-border)' }}>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="btn btn-outline btn-full btn-sm"
          style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  )
}
