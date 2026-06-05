import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Already logged in → redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/student', { replace: true })
    }
  }, [isAuthenticated])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ===== NAVBAR ===== */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--bg-border)',
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--gradient-brand)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem'
          }}>📚</div>
          <span style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800, fontSize: '1.25rem',
            color: 'var(--text-primary)'
          }}>SmartLMS</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/college/register" className="btn btn-primary btn-sm">
            Register College
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section style={{
        minHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 2rem',
        position: 'relative',
      }}>
        {/* Background glow blobs */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%',
          width: '350px', height: '350px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Badge */}
        <div className="animate-fadeInUp" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '999px',
          padding: '0.4rem 1rem',
          fontSize: '0.8rem', fontWeight: 600,
          color: 'var(--color-primary-light)',
          marginBottom: '2rem'
        }}>
          <span>⚡</span> Paperless · Contactless · Smart
        </div>

        {/* Heading */}
        <h1 className="heading-hero animate-fadeInUp" style={{ animationDelay: '0.1s', maxWidth: '900px' }}>
          The Modern Library
          <br />
          <span className="gradient-text">Management System</span>
          <br />
          for Every College
        </h1>

        <p className="animate-fadeInUp" style={{
          animationDelay: '0.2s',
          color: 'var(--text-secondary)',
          fontSize: '1.15rem',
          maxWidth: '600px',
          marginTop: '1.5rem',
          lineHeight: 1.7
        }}>
          Replace paper registers with QR-based digital cards. Track books, calculate
          penalties automatically, and manage your entire college library in one
          beautiful dashboard.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fadeInUp" style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap',
          justifyContent: 'center', marginTop: '2.5rem',
          animationDelay: '0.3s'
        }}>
          <Link to="/college/register" className="btn btn-primary btn-lg">
            🎓 Register Your College — Free
          </Link>
          <Link to="/login" className="btn btn-outline btn-lg">
            Sign In →
          </Link>
        </div>

        {/* Stats Row */}
        <div className="animate-fadeInUp" style={{
          display: 'flex', gap: '3rem', flexWrap: 'wrap',
          justifyContent: 'center', marginTop: '4rem',
          animationDelay: '0.4s'
        }}>
          {[
            { number: '< 500ms', label: 'QR Scan Speed' },
            { number: '100%', label: 'Paperless' },
            { number: '24/7', label: 'Auto Reminders' },
            { number: '∞', label: 'Colleges Supported' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Outfit, sans-serif', fontWeight: 900,
                fontSize: '1.75rem', color: 'var(--text-primary)'
              }}>{stat.number}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="heading-xl">Everything Your Library Needs</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            One platform for students, faculty, and administrators
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              icon: '🔐', title: 'College Domain Security',
              desc: 'Only authorized college email IDs can register. Each college sets their own domain like @mitindore.edu.',
              gradient: 'rgba(99,102,241,0.1)'
            },
            {
              icon: '🪪', title: 'Digital QR Library Card',
              desc: 'Each student gets a beautiful digital ID card with unique QR code — no physical cards needed.',
              gradient: 'rgba(139,92,246,0.1)'
            },
            {
              icon: '📷', title: 'Instant QR Scanning',
              desc: "Faculty scans student's QR code using their laptop camera. Student's complete profile appears in under 500ms.",
              gradient: 'rgba(6,182,212,0.1)'
            },
            {
              icon: '📊', title: 'Real-Time Penalty Tracker',
              desc: 'Overdue books? Fine amount auto-calculates every day. Students can see their pending fine live on dashboard.',
              gradient: 'rgba(245,158,11,0.1)'
            },
            {
              icon: '📧', title: 'Automated Email Reminders',
              desc: 'Spring Scheduler sends personalized overdue emails at 8 AM daily. No manual work needed.',
              gradient: 'rgba(16,185,129,0.1)'
            },
            {
              icon: '🏫', title: 'Multi-Tenant SaaS',
              desc: 'Any college in India can register and get their isolated library system. Fully independent data.',
              gradient: 'rgba(239,68,68,0.1)'
            },
          ].map(feature => (
            <div key={feature.title} className="card" style={{
              background: feature.gradient,
              borderColor: 'var(--bg-border)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section style={{
        padding: '5rem 2rem',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--bg-border)',
        borderBottom: '1px solid var(--bg-border)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="heading-xl" style={{ marginBottom: '0.75rem' }}>Get Started in 3 Steps</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
            From zero to fully functional library system in minutes
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { step: '01', icon: '🏫', title: 'Register Your College', desc: 'Fill in college details, set your email domain, and create admin account in 3 quick steps.' },
              { step: '02', icon: '📧', title: 'Students Self-Register', desc: 'Students sign up with college email, verify OTP, and instantly get their digital library card with QR code.' },
              { step: '03', icon: '📷', title: 'Scan & Manage', desc: "Faculty scans QR to pull up any student's profile. Issue books, track returns, all without paper." },
            ].map(item => (
              <div key={item.step} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--bg-border)',
                borderRadius: '16px', padding: '2rem',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--gradient-brand)',
                  color: 'white', fontWeight: 800,
                  fontSize: '0.7rem', letterSpacing: '0.1em',
                  padding: '0.25rem 0.75rem', borderRadius: '0 0 8px 8px'
                }}>{item.step}</div>
                <div style={{ fontSize: '2.5rem', margin: '1rem 0 1rem' }}>{item.icon}</div>
                <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <h2 className="heading-xl" style={{ marginBottom: '1rem' }}>
          Ready to go <span className="gradient-text">paperless?</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
          Join colleges already using SmartLMS for their library operations.
        </p>
        <Link to="/college/register" className="btn btn-primary btn-lg">
          🚀 Register Your College Now
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--bg-border)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        SmartLMS © 2026 — QR-Enabled College Library Management System
      </footer>
    </div>
  )
}
