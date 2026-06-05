import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_FILTERS = ['ALL', 'ISSUED', 'OVERDUE', 'RETURNED']

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTransactions() }, [])

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/admin/transactions')
      setTransactions(res.data || [])
    } catch { toast.error('Failed to load transactions') }
    finally { setLoading(false) }
  }

  const returnBook = async (txnId, studentName, bookTitle) => {
    if (!window.confirm(`Return "${bookTitle}" from ${studentName}?`)) return
    try {
      await api.put(`/admin/return/${txnId}`)
      toast.success('Book returned! ✅')
      fetchTransactions()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed.')
    }
  }

  const filtered = filter === 'ALL' ? transactions
    : transactions.filter(t => t.status === filter)

  const counts = {
    ALL: transactions.length,
    ISSUED: transactions.filter(t => t.status === 'ISSUED').length,
    OVERDUE: transactions.filter(t => t.status === 'OVERDUE').length,
    RETURNED: transactions.filter(t => t.status === 'RETURNED').length,
  }

  const totalOverdueFine = transactions
    .filter(t => t.status !== 'RETURNED')
    .reduce((sum, t) => sum + (t.livePenalty || 0), 0)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">🔄 Transactions</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            All book issue and return records
          </p>
        </div>

        {/* Summary Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Issued', value: counts.ISSUED, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Overdue', value: counts.OVERDUE, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { label: 'Returned', value: counts.RETURNED, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { label: 'Pending Fines', value: `₹${totalOverdueFine.toFixed(0)}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: '1.2rem' }}>
                {s.label === 'Total Issued' ? '📖' : s.label === 'Overdue' ? '⚠️' : s.label === 'Returned' ? '✅' : '💰'}
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          background: 'var(--bg-card)', padding: '0.375rem',
          borderRadius: '12px', border: '1px solid var(--bg-border)',
          width: 'fit-content', flexWrap: 'wrap'
        }}>
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none',
              background: filter === s ? 'var(--gradient-brand)' : 'transparent',
              color: filter === s ? 'white' : 'var(--text-secondary)',
              fontWeight: filter === s ? 600 : 400, fontSize: '0.85rem',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            background: 'var(--bg-card)', borderRadius: '16px',
            border: '1px solid var(--bg-border)', color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} transactions found.</p>
          </div>
        ) : (
          <div className="table-wrapper animate-fadeIn">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.studentName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.studentEmail}</div>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: '180px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.bookTitle}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{t.issueDate}</td>
                    <td style={{
                      color: t.isOverdue ? 'var(--color-danger)' : 'var(--text-secondary)',
                      fontWeight: t.isOverdue ? 600 : 400, fontSize: '0.82rem'
                    }}>{t.dueDate}</td>
                    <td style={{ color: 'var(--color-success)', fontSize: '0.82rem' }}>
                      {t.returnDate || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${
                        t.status === 'RETURNED' ? 'badge-muted' :
                        t.status === 'OVERDUE' ? 'badge-danger' : 'badge-success'
                      }`}>
                        {t.status === 'RETURNED' ? '✓ Returned' :
                         t.status === 'OVERDUE' ? '⚠️ Overdue' : '● Active'}
                      </span>
                    </td>
                    <td style={{
                      fontWeight: 700,
                      color: (t.livePenalty || t.penaltyAmount) > 0 ? 'var(--color-danger)' : 'var(--text-muted)'
                    }}>
                      {t.status === 'RETURNED'
                        ? (t.penaltyAmount > 0 ? `₹${t.penaltyAmount.toFixed(2)}` : '₹0')
                        : (t.livePenalty > 0 ? `₹${t.livePenalty.toFixed(2)}` : '—')}
                    </td>
                    <td>
                      {t.status !== 'RETURNED' && (
                        <button className="btn btn-success btn-sm"
                          onClick={() => returnBook(t.id, t.studentName, t.bookTitle)}>
                          ↩ Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
