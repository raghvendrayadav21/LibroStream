import { useState, useEffect, useRef } from 'react'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function LibraryCard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef()

  useEffect(() => { 
    fetchProfile() 
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/student/profile')
      setProfile(res.data)
    } catch { 
      toast.error('Failed to load student profile') 
    } finally { 
      setLoading(false) 
    }
  }

  const downloadCard = () => {
    if (!profile?.qrCodeBase64) return
    const link = document.createElement('a')
    link.href = profile.qrCodeBase64
    link.download = `SmartLMS-Card-${profile.libraryCardNumber}.png`
    link.click()
    toast.success('Library card QR code downloaded!')
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your library card...</p>
        </div>
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ background: 'radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.02) 0%, transparent 50%)' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">My Digital Library Card</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Present your personalized QR library card at the counter to instantly check out or return books
          </p>
        </div>

        {/* Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '2.5rem',
          alignItems: 'start',
          flexWrap: 'wrap'
        }}>
          {/* Card Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '340px' }} className="animate-fadeIn">
            <div ref={cardRef} style={{ width: '100%' }}>
              <div className="library-card animate-pulse-glow" style={{ width: '100%', height: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {profile?.collegeLogoBase64 ? (
                    <img src={profile.collegeLogoBase64} alt="College Logo"
                      style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', padding: '2px' }} />
                  ) : (
                    <div style={{
                      width: '42px', height: '42px', background: 'var(--gradient-brand)',
                      borderRadius: '8px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.25rem'
                    }}>📚</div>
                  )}
                  <div>
                    <div style={{
                      fontFamily: 'Outfit,sans-serif', fontWeight: 800,
                      fontSize: '0.95rem', color: 'white', lineHeight: 1.2
                    }}>{profile?.collegeName || 'SmartLMS College'}</div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Digital Library Card
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

                {/* QR Code Container */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {profile?.qrCodeBase64 ? (
                    <div style={{
                      background: 'white', padding: '10px', borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'inline-block'
                    }}>
                      <img src={profile.qrCodeBase64} alt="Student QR Code"
                        style={{ width: '150px', height: '150px', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: '170px', height: '170px', background: 'rgba(255,255,255,0.04)',
                      borderRadius: '16px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem'
                    }}>QR Code Pending</div>
                  )}
                </div>

                {/* Details Footer */}
                <div>
                  <div style={{
                    fontFamily: 'Outfit,sans-serif', fontWeight: 800,
                    fontSize: '1.2rem', color: 'white', textAlign: 'center', marginBottom: '0.2rem'
                  }}>{profile?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '0.75rem' }}>
                    {profile?.branch && `${profile.branch} Branch`} {profile?.enrollmentYear && `\u2022 Class of ${profile.enrollmentYear}`}
                  </div>
                  
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px', padding: '0.6rem 0.85rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.1rem' }}>
                        Card Number
                      </div>
                      <div style={{
                        fontFamily: 'Outfit,sans-serif', fontWeight: 700,
                        color: 'white', fontSize: '0.9rem', letterSpacing: '0.05em'
                      }}>{profile?.libraryCardNumber}</div>
                    </div>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '6px', padding: '0.25rem 0.6rem',
                      fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-success)',
                      textTransform: 'uppercase'
                    }}>ACTIVE</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Actions */}
            <button
              id="download-qr-btn"
              className="btn btn-primary btn-full"
              style={{ padding: '0.85rem' }}
              onClick={downloadCard}>
              ⬇️ Download Card QR Image
            </button>
          </div>

          {/* Details Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fadeIn">
            
            {/* Table Profile Details */}
            <div className="card-glass" style={{ padding: '1.5rem', border: '1px solid var(--bg-border)', background: 'rgba(255,255,255,0.015)' }}>
              <h3 className="heading-md" style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Profile Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Full Name', value: profile?.name, icon: '👤' },
                  { label: 'College Email', value: profile?.email, icon: '📧' },
                  { label: 'Branch / Course', value: profile?.branch || 'General', icon: '🎓' },
                  { label: 'Enrollment Year', value: profile?.enrollmentYear || '—', icon: '📅' },
                  { label: 'Library Card No.', value: profile?.libraryCardNumber, icon: '🪪' },
                  { label: 'College Name', value: profile?.collegeName, icon: '🏫' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem', background: 'var(--bg-card)',
                    borderRadius: '12px', border: '1px solid var(--bg-border)'
                  }}>
                    <span style={{ fontSize: '1.5rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', borderRadius: '8px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                        {item.label}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="card" style={{ background: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.15)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>📋</span> Library Card Usage Guidelines
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0 }}>
                {[
                  'Display this QR card on your mobile screen at the central library desk.',
                  'Librarians will scan the QR code to load your account instantly.',
                  'Ensure all books are issued/returned digitally by verifying with the librarian.',
                  'Track due dates on your dashboard to avoid library service holds.',
                  'Fines calculate automatically at a flat rate of ₹5.00 per day after the due date.'
                ].map((tip, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--color-primary-light)', fontWeight: 800 }}>{i + 1}.</span>
                    <span>{tip}</span>
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
