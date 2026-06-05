import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'

export default function Penalties() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPenalties()
    const interval = setInterval(fetchPenalties, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchPenalties = async () => {
    try {
      const res = await api.get('/student/penalties')
      setData(res.data)
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Calculating live penalties...</p>
        </div>
      </main>
    </div>
  )

  const overdueBooks = (data?.activeBooks || []).filter(b => b.isOverdue)
  const onTimeBooks = (data?.activeBooks || []).filter(b => !b.isOverdue)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(239, 68, 68, 0.015) 0%, transparent 50%)' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">Penalty Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Live late fine calculations and overdue status tracker — updates automatically
          </p>
        </div>

        {/* Total Fine Banner */}
        {data?.totalPendingPenalty > 0 ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '24px', padding: '2.5rem 2rem',
            marginBottom: '2.5rem', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(239, 68, 68, 0.05)'
          }} className="animate-pulse-glow">
            
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              fontSize: '9rem', opacity: 0.03, pointerEvents: 'none', userSelect: 'none'
            }}>⚠️</div>

            <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Pending Fine Balance
            </div>
            
            <div style={{
              fontFamily: 'Outfit,sans-serif', fontWeight: 900,
              fontSize: '4rem', color: 'var(--color-danger)',
              lineHeight: 1, textShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
            }}>
              ₹{data.totalPendingPenalty.toFixed(2)}
            </div>

            <div style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.9rem', marginTop: '0.75rem', fontWeight: 500 }}>
              {data.overdueCount} overdue book{data.overdueCount > 1 ? 's' : ''} &middot; Fine accumulates daily
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', marginTop: '1.25rem', fontSize: '0.75rem', color: '#fca5a5' }}>
              <span>ℹ️</span> Fines are calculated at ₹5.00 per day past the due date. Pay at the library counter.
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '24px', padding: '2.5rem 2rem',
            marginBottom: '2.5rem', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.02)'
          }} className="animate-fadeIn">
            <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-success)' }}>
              Account In Good Standing!
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '360px', margin: '0.5rem auto 0' }}>
              No pending fines or overdue items. All books are returned or on track.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', flexWrap: 'wrap', alignItems: 'start' }}>
          
          {/* Fines list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Overdue Books list */}
            {overdueBooks.length > 0 && (
              <div>
                <h2 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--color-danger)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🚨</span> Overdue Items
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {overdueBooks.map(book => (
                    <div key={book.id} className="card-glass" style={{
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
                      background: 'rgba(239, 68, 68, 0.015)'
                    }}>
                      <div style={{
                        width: '46px', height: '46px', background: 'rgba(239, 68, 68, 0.12)',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', color: 'var(--color-danger)'
                      }}>📕</div>

                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{book.bookTitle}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Due Date: <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{book.dueDate}</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>&middot;</span>
                          <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{book.daysLate} days late</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.6rem', color: 'var(--color-danger)', lineHeight: 1.1 }}>
                          ₹{book.livePenalty.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          +₹5.00/day
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Books on Time list */}
            {onTimeBooks.length > 0 && (
              <div>
                <h2 className="heading-md" style={{ marginBottom: '1rem', color: 'var(--color-success)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✓</span> Books On Time
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {onTimeBooks.map(book => {
                    const due = new Date(book.dueDate)
                    const today = new Date()
                    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={book.id} className="card-glass" style={{
                        border: '1px solid var(--bg-border)',
                        padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem',
                        background: 'rgba(255,255,255,0.01)'
                      }}>
                        <div style={{
                          width: '46px', height: '46px', background: 'rgba(16, 185, 129, 0.1)',
                          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', color: 'var(--color-success)'
                        }}>📗</div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{book.bookTitle}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Due Date: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{book.dueDate}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-success" style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem' }}>
                            {daysLeft} days left
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {data?.activeBooks?.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '4rem 2rem',
                background: 'var(--bg-card)', borderRadius: '20px',
                border: '1px solid var(--bg-border)', color: 'var(--text-muted)'
              }} className="animate-fadeIn">
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No books currently issued.</p>
              </div>
            )}
          </div>

          {/* Info Panel / Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)' }}>
              <h3 className="heading-md" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📜</span> Library Fine Policy
              </h3>
              
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
                {[
                  { title: 'Standard Loan Period', desc: 'Books can be kept for up to 14 days from the date of issue.' },
                  { title: 'Late Return Penalty', desc: 'Fines accrue at a flat rate of ₹5.00 per day after the due date.' },
                  { title: 'Payment Mode', desc: 'Penalties must be settled in person at the central library helpdesk.' },
                  { title: 'Account Hold Rule', desc: 'Fines exceeding ₹100.00 will temporarily freeze library card privileges.' }
                ].map((rule, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>{idx + 1}.</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'white', marginBottom: '0.15rem' }}>{rule.title}</div>
                      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rule.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
