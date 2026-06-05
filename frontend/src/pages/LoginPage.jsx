import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [collegeName, setCollegeName] = useState('')
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const emailValue = watch('email', '')

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) navigate(isAdmin ? '/admin' : '/student', { replace: true })
  }, [isAuthenticated])

  // As user types email, look up college name
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (emailValue.includes('@') && emailValue.includes('.')) {
        try {
          const res = await api.get(`/college/domain?email=${emailValue}`)
          if (res.data.found) setCollegeName(res.data.collegeName)
          else setCollegeName('')
        } catch { setCollegeName('') }
      } else {
        setCollegeName('')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [emailValue])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', data)
      login(res.data)
      toast.success(`Welcome back, ${res.data.name}! 👋`)
      navigate(res.data.role === 'FACULTY_ADMIN' ? '/admin' : '/student')
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '700px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-fadeInUp">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '44px', height: '44px', background: 'var(--gradient-brand)',
                borderRadius: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.4rem'
              }}>📚</div>
              <span style={{
                fontFamily: 'Outfit,sans-serif', fontWeight: 900,
                fontSize: '1.75rem', color: 'var(--text-primary)'
              }}>SmartLMS</span>
            </div>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your library account
          </p>
        </div>

        {/* College detected banner */}
        {collegeName && (
          <div className="animate-fadeIn" style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '10px', padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <span>🏫</span>
            <span style={{ color: 'var(--color-success)' }}>
              <strong>{collegeName}</strong> detected
            </span>
          </div>
        )}

        {/* Form Card */}
        <div className="card-glass animate-fadeInUp" style={{ padding: '2rem', animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div className="input-group">
              <label className="input-label">College Email</label>
              <input
                id="login-email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                type="email"
                placeholder="yourname@college.edu"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
                })}
              />
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                id="login-password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-full"
              style={{ marginTop: '0.5rem', padding: '0.875rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="divider" style={{ margin: '1.5rem 0' }}>or</div>

          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            New student?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
              Create account →
            </Link>
          </div>
        </div>

        {/* College register link */}
        <div style={{
          textAlign: 'center', marginTop: '1.5rem',
          padding: '1rem', background: 'rgba(99,102,241,0.05)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '12px', fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          🏫 College admin?{' '}
          <Link to="/college/register"
            style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
            Register your college →
          </Link>
        </div>
      </div>
    </div>
  )
}
