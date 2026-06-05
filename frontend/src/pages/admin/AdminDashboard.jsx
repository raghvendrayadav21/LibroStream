import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentTxns, setRecentTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [statsRes, txnRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/transactions')
      ])
      setStats(statsRes.data)
      setRecentTxns((txnRes.data || [])
        .filter(t => t.status !== 'RETURNED')
        .slice(0, 5))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const statCards = stats ? [
    { icon: '👨‍🎓', label: 'Total Students', value: stats.totalStudents, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { icon: '📚', label: 'Total Books', value: stats.totalBooks, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { icon: '📖', label: 'Books Issued', value: stats.issuedBooks, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { icon: '⚠️', label: 'Overdue Books', value: stats.overdueBooks, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { icon: '💰', label: 'Pending Fines', value: `₹${(stats.totalPendingFines || 0).toFixed(0)}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ] : []

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="heading-lg">
            Admin Dashboard <span style={{ fontSize: '1.5rem' }}>👑</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {user?.collegeName} — Faculty Control Center
          </p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem', marginBottom: '2rem'
          }}>
            {statCards.map((s, i) => (
              <div key={s.label} className="stat-card animate-fadeInUp"
                style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="stat-icon" style={{ background: s.bg }}>
                  <span>{s.icon}</span>
                </div>
                <div>
                  <div style={{
                    fontFamily: 'Outfit,sans-serif', fontWeight: 800,
                    fontSize: '1.75rem', color: s.color
                  }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="heading-md" style={{ marginBottom: '1rem' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '📷', label: 'Scan Student QR', desc: 'Scan to instantly open student profile', to: '/admin/scan', color: 'var(--gradient-brand)' },
              { icon: '📖', label: 'Manage Books', desc: 'Add, search or delete book inventory', to: '/admin/books', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
              { icon: '🔄', label: 'Transactions', desc: 'View all active & overdue issues', to: '/admin/transactions', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
              { icon: '⚙️', label: 'College Settings', desc: 'Update domain, penalty, logo', to: '/admin/settings', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
            ].map(action => (
              <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}>
                  <div style={{
                    width: '44px', height: '44px',
                    background: action.color,
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', marginBottom: '0.875rem'
                  }}>{action.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{action.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="heading-md">Active Issues</h2>
            <Link to="/admin/transactions" style={{ fontSize: '0.85rem', color: 'var(--color-primary-light)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {recentTxns.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem',
              background: 'var(--bg-card)', borderRadius: '16px',
              border: '1px solid var(--bg-border)', color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <p>No active book issues at the moment.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{t.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.studentEmail}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{t.bookTitle}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.issueDate}</td>
                      <td style={{ color: t.isOverdue ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: t.isOverdue ? 600 : 400, fontSize: '0.85rem' }}>
                        {t.dueDate}
                      </td>
                      <td>
                        <span className={`badge ${t.isOverdue ? 'badge-danger' : 'badge-success'}`}>
                          {t.isOverdue ? '⚠️ Overdue' : '✓ Active'}
                        </span>
                      </td>
                      <td style={{ color: t.livePenalty > 0 ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {t.livePenalty > 0 ? `₹${t.livePenalty.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
