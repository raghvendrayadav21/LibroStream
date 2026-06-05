import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ activeBooks: 0, overdueBooks: 0, totalPenalty: 0 })
  const [recentBooks, setRecentBooks] = useState([])
  const [catalogBooks, setCatalogBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isCardZoomed, setIsCardZoomed] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!loading) {
        fetchCatalog()
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery, selectedCategory])

  const fetchInitialData = async () => {
    try {
      const [profileRes, penaltyRes, booksRes, catalogRes] = await Promise.all([
        api.get('/student/profile').catch(() => ({ data: null })),
        api.get('/student/penalties').catch(() => ({ data: { activeBooks: [], totalPendingPenalty: 0, overdueCount: 0 } })),
        api.get('/student/my-books').catch(() => ({ data: [] })),
        api.get('/student/books').catch(() => ({ data: [] }))
      ])

      setProfile(profileRes.data)
      
      const penaltyData = penaltyRes.data
      setStats({
        activeBooks: penaltyData.activeBooks?.length || booksRes.data?.length || 0,
        overdueBooks: penaltyData.overdueCount || 0,
        totalPenalty: penaltyData.totalPendingPenalty || 0
      })
      setRecentBooks((booksRes.data || []).slice(0, 3))
      setCatalogBooks(catalogRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchCatalog = async () => {
    try {
      setSearchLoading(true)
      let url = '/student/books'
      const params = []
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`)
      }
      if (selectedCategory !== 'All') {
        params.push(`category=${encodeURIComponent(selectedCategory)}`)
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`
      }
      const res = await api.get(url)
      setCatalogBooks(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSearchLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Calculate days remaining and return percentage for progress bar
  const getLoanProgress = (dueDateStr) => {
    const due = new Date(dueDateStr)
    const today = new Date()
    const diffTime = due - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Default duration is 14 days
    const totalDays = 14
    if (diffDays <= 0) return { percent: 100, daysLeft: 0, isOverdue: true, color: 'var(--color-danger)' }
    
    const percent = Math.max(0, Math.min(100, ((totalDays - diffDays) / totalDays) * 100))
    let color = 'var(--color-success)'
    if (diffDays <= 3) color = 'var(--color-warning)'
    
    return { percent, daysLeft: diffDays, isOverdue: false, color }
  }

  const statCards = [
    { 
      icon: (
        <svg style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ), 
      label: 'Books Issued', 
      value: stats.activeBooks, 
      color: '#6366f1', 
      bg: 'rgba(99, 102, 241, 0.08)',
      borderColor: 'rgba(99, 102, 241, 0.2)'
    },
    { 
      icon: (
        <svg style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ), 
      label: 'Overdue Books', 
      value: stats.overdueBooks, 
      color: '#ef4444', 
      bg: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.2)'
    },
    { 
      icon: (
        <svg style={{ width: '22px', height: '22px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      label: 'Pending Fine', 
      value: `₹${stats.totalPenalty.toFixed(2)}`, 
      color: '#f59e0b', 
      bg: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.2)'
    },
  ]

  const categories = ['All', 'Computer Science', 'Information Technology', 'Mathematics', 'Physics', 'Chemistry', 'Literature', 'Fiction']

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: '36px', height: '36px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading student portal...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.03) 0%, transparent 60%)' }}>
        
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📅</span> {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="heading-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🏫</span> {profile?.collegeName || user?.collegeName} <span style={{ color: 'var(--bg-border)' }}>|</span> Student Portal
            </p>
          </div>
          
          {/* Quick Stats overview tag */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px', border: '1px solid var(--bg-border)', fontSize: '0.85rem'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Library Account:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>ACTIVE</span>
          </div>
        </div>

        {/* Overdue Alert Banner */}
        {stats.overdueBooks > 0 && (
          <div className="penalty-alert animate-fadeInUp" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.08)'
          }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: '1rem' }}>
                Attention Needed: {stats.overdueBooks} book{stats.overdueBooks > 1 ? 's' : ''} overdue!
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Accumulated fine: ₹{stats.totalPenalty.toFixed(2)}. Please return overdue items immediately to avoid account suspension.
              </div>
            </div>
            <Link to="/student/penalties" className="btn btn-danger btn-sm" style={{ padding: '0.5rem 1.25rem', borderRadius: '10px' }}>
              Resolve Fine →
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem', marginBottom: '2rem'
        }}>
          {statCards.map(s => (
            <div key={s.label} className="stat-card animate-fadeInUp" style={{
              background: 'var(--bg-card)',
              border: `1px solid ${s.borderColor}`,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color, borderRadius: '12px' }}>
                {s.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: 'Outfit,sans-serif', fontWeight: 800,
                  fontSize: '2rem', color: s.color, lineHeight: 1.1
                }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Library Card row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          
          {/* Quick Actions Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h2 className="heading-md" style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚡</span> Quick Links
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                
                <Link to="/student/card" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-border)',
                    height: '100%'
                  }}>
                    <span style={{ fontSize: '1.75rem' }}>🪪</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>Library Card</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display student QR code</div>
                    </div>
                  </div>
                </Link>

                <Link to="/student/books" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-border)',
                    height: '100%'
                  }}>
                    <span style={{ fontSize: '1.75rem' }}>📚</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>My Books</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View active issues & history</div>
                    </div>
                  </div>
                </Link>

                <Link to="/student/penalties" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{
                    padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--bg-border)',
                    height: '100%'
                  }}>
                    <span style={{ fontSize: '1.75rem' }}>⚠️</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>Penalties</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check late fines & tracker</div>
                    </div>
                  </div>
                </Link>

              </div>
            </div>

            {/* Issued Books Table card view */}
            <div className="card-glass" style={{ padding: '1.25rem', border: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📖</span> Currently Issued Books
                </h3>
                <Link to="/student/books" style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                  View All →
                </Link>
              </div>

              {recentBooks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No books currently issued. Visit library to issue.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentBooks.map(book => {
                    const progress = getLoanProgress(book.dueDate)
                    return (
                      <div key={book.id} style={{
                        padding: '1rem', background: 'rgba(255, 255, 255, 0.01)',
                        borderRadius: '12px', border: '1px solid var(--bg-border)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{book.bookTitle}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{book.bookAuthor}</div>
                          </div>
                          <span className={`badge ${book.isOverdue ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                            {book.isOverdue ? '⚠️ Overdue' : `✓ ${progress.daysLeft} days left`}
                          </span>
                        </div>
                        
                        {/* Time Progress Bar */}
                        <div style={{ marginTop: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                            <span>Issued: {book.issueDate}</span>
                            <span>Due: {book.dueDate}</span>
                          </div>
                          <div className="progress-bar" style={{ height: '6px' }}>
                            <div className="progress-bar-fill" style={{
                              width: `${progress.percent}%`,
                              background: progress.color,
                              boxShadow: `0 0 8px ${progress.color}`
                            }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mini Digital Library Card Preview */}
          <div style={{ position: 'relative' }}>
            <h2 className="heading-md" style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🪪</span> Digital Library Card
            </h2>
            <div 
              onClick={() => setIsCardZoomed(true)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              className="hover:scale-[1.02] hover:shadow-glow"
            >
              <div className="library-card" style={{ width: '100%', height: '330px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {profile?.collegeLogoBase64 ? (
                    <img src={profile.collegeLogoBase64} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', background: 'var(--gradient-brand)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📚</div>
                  )}
                  <div>
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '0.85rem', color: 'white', lineHeight: 1.2 }}>
                      {profile?.collegeName || 'SmartLMS College'}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Digital Library Card
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.75rem 0' }}>
                  {profile?.qrCodeBase64 ? (
                    <div style={{ background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                      <img src={profile.qrCodeBase64} alt="Student QR" style={{ width: '110px', height: '110px' }} />
                    </div>
                  ) : (
                    <div style={{ width: '126px', height: '126px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>QR code pending</div>
                  )}
                </div>

                <div>
                  <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1rem', color: 'white', textAlign: 'center' }}>
                    {profile?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '0.5rem' }}>
                    {profile?.branch} &middot; {profile?.enrollmentYear}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                    <span style={{ fontFamily: 'monospace', color: 'white', fontSize: '0.8rem' }}>{profile?.libraryCardNumber}</span>
                    <span style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--color-success)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              💡 Click card to zoom / scan
            </p>
          </div>
        </div>

        {/* Library Catalog Explorer Section */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '2rem', marginBottom: '1.5rem' }}>
            <h2 className="heading-md" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span>🔍</span> Library Catalog Explorer
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Search real-time book availability and physical shelf locations in the college library
            </p>
          </div>

          {/* Search Controls */}
          <div style={{
            display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
            background: 'var(--bg-card)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--bg-border)'
          }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
              <input 
                type="text"
                className="input"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem',
                    fontWeight: 600, cursor: 'pointer', border: '1px solid var(--bg-border)',
                    background: selectedCategory === cat ? 'var(--gradient-brand)' : 'var(--bg-elevated)',
                    color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedCategory === cat ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Book Catalog Results Grid */}
          {searchLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Searching library catalog...</p>
            </div>
          ) : catalogBooks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)',
              borderRadius: '16px', border: '1px solid var(--bg-border)', color: 'var(--text-muted)'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>📚</span>
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No books match your query</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try refining your keywords or changing the category filter</p>
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }} className="animate-fadeIn">
              {catalogBooks.map(book => (
                <div key={book.id} className="card-glass" style={{
                  padding: '1.25rem', border: '1px solid var(--bg-border)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  gap: '1rem', background: 'rgba(255,255,255,0.015)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {book.category || 'General'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {book.isbn}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                      {book.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      by {book.author}
                    </p>
                    
                    {book.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: '-webkit-box', WebkitLineBreak: 'anywhere', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {book.description}
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>LOCATION</div>
                      <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span>📍</span> {book.shelfLocation || 'Section A-1'}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                        background: book.available ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: book.available ? 'var(--color-success)' : 'var(--color-danger)',
                        fontWeight: 700, fontSize: '0.7rem'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: book.available ? 'var(--color-success)' : 'var(--color-danger)' }} />
                        {book.available ? `${book.availableCopies} Available` : 'Issued Out'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for QR Card Zoom */}
        {isCardZoomed && profile && (
          <div className="modal-overlay" onClick={() => setIsCardZoomed(false)}>
            <div 
              className="modal-content animate-fadeInUp" 
              onClick={e => e.stopPropagation()}
              style={{ padding: '2rem', maxWidth: '380px', borderRadius: '24px', background: 'linear-gradient(135deg, #11111a 0%, #161625 100%)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="heading-md" style={{ fontSize: '1.1rem' }}>Library QR Code</h3>
                <button 
                  onClick={() => setIsCardZoomed(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.25rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                {profile.qrCodeBase64 ? (
                  <div style={{
                    background: 'white', padding: '16px', borderRadius: '20px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)'
                  }}>
                    <img src={profile.qrCodeBase64} alt="QR Code Full" style={{ width: '220px', height: '220px', display: 'block' }} />
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>QR Code not available</p>
                )}
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>{profile.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Card No: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{profile.libraryCardNumber}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                  Show this QR code to the college librarian on your mobile screen to issue or return books instantly.
                </p>
                
                <button 
                  className="btn btn-primary btn-full btn-sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = profile.qrCodeBase64
                    link.download = `SmartLMS-QR-${profile.libraryCardNumber}.png`
                    link.click()
                  }}
                  style={{ borderRadius: '12px', padding: '0.7rem' }}
                >
                  ⬇️ Download QR Image
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
