import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'

export default function MyBooks() {
  const [books, setBooks] = useState([])
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    fetchBooks() 
  }, [])

  const fetchBooks = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get('/student/my-books'),
        api.get('/student/history')
      ])
      setBooks(activeRes.data || [])
      setHistory((historyRes.data || []).filter(t => t.status === 'RETURNED'))
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  const getLoanProgress = (dueDateStr) => {
    const due = new Date(dueDateStr)
    const today = new Date()
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const totalDays = 14
    if (diffDays <= 0) return { percent: 100, daysLeft: 0, isOverdue: true, color: 'var(--color-danger)' }
    
    const percent = Math.max(0, Math.min(100, ((totalDays - diffDays) / totalDays) * 100))
    let color = 'var(--color-success)'
    if (diffDays <= 3) color = 'var(--color-warning)'
    
    return { percent, daysLeft: diffDays, isOverdue: false, color }
  }

  const statusBadge = (t) => {
    if (t.status === 'RETURNED') return <span className="badge badge-muted">✓ Returned</span>
    if (t.isOverdue) return <span className="badge badge-danger">⚠️ Overdue</span>
    return <span className="badge badge-success">✓ On Time</span>
  }

  const displayList = tab === 'active' ? books : history

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(139, 92, 246, 0.02) 0%, transparent 50%)' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">My Issued Books</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Track active library loans, due dates, return statuses, and active fines
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '2rem',
          background: 'var(--bg-card)', padding: '0.4rem',
          borderRadius: '14px', border: '1px solid var(--bg-border)',
          width: 'fit-content'
        }}>
          {[
            { key: 'active', label: `📚 Active Loans (${books.length})` },
            { key: 'history', label: `📋 Return History (${history.length})` },
          ].map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '10px', border: 'none',
                background: tab === t.key ? 'var(--gradient-brand)' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--text-secondary)',
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: '0.875rem', cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: tab === t.key ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '32px', height: '32px' }} />
            <p>Loading book records...</p>
          </div>
        ) : displayList.length === 0 ? (
          /* Empty State */
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'var(--bg-card)', borderRadius: '24px',
            border: '1px solid var(--bg-border)', color: 'var(--text-muted)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }} className="animate-fadeIn">
            <div style={{ fontSize: '4rem', marginBottom: '1.25rem' }}>
              {tab === 'active' ? '📭' : '📋'}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {tab === 'active' ? 'No Active Loans' : 'No Return History'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0 auto' }}>
              {tab === 'active' 
                ? 'You do not have any library books issued at the moment. Visit the library and present your QR code to borrow a book.' 
                : 'Your book return transactions will be archived here once completed.'}
            </p>
          </div>
        ) : (
          /* Book List Cards / Table */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fadeIn">
            
            {/* Grid for Active Cards */}
            {tab === 'active' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {books.map(t => {
                  const progress = getLoanProgress(t.dueDate)
                  return (
                    <div key={t.id} className="card-glass" style={{
                      padding: '1.5rem', border: '1px solid var(--bg-border)',
                      background: 'rgba(255, 255, 255, 0.015)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span className={`badge ${t.isOverdue ? 'badge-danger' : 'badge-success'}`}>
                            {t.isOverdue ? '⚠️ Overdue' : `✓ ${progress.daysLeft} days left`}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: t.livePenalty > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                            {t.livePenalty > 0 ? `Fine: ₹${t.livePenalty.toFixed(2)}` : 'No Fine'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>
                          {t.bookTitle}
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          by {t.bookAuthor || 'Unknown'}
                        </p>
                      </div>

                      <div>
                        {/* Time Progress Bar */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            <span>Issued: {t.issueDate}</span>
                            <span>Due: {t.dueDate}</span>
                          </div>
                          <div className="progress-bar" style={{ height: '6px' }}>
                            <div className="progress-bar-fill" style={{
                              width: `${progress.percent}%`,
                              background: progress.color,
                              boxShadow: `0 0 8px ${progress.color}`
                            }} />
                          </div>
                        </div>

                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderTop: '1px solid var(--bg-border)', paddingTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-secondary)'
                        }}>
                          <span>Transaction ID:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'white' }}>{t.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Table Wrapper for Return History */
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Fine Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((t, i) => (
                      <tr key={t.id}>
                        <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                        <td style={{ fontWeight: 700, color: 'white' }}>{t.bookTitle}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.bookAuthor || '—'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.issueDate}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.dueDate}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{t.returnDate}</td>
                        <td>{statusBadge(t)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: t.penaltyAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {t.penaltyAmount > 0 ? `₹${t.penaltyAmount.toFixed(2)}` : '₹0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  )
}
