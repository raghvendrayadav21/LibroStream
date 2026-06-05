import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/axios'

// ── OTP Input Component (6 boxes) ────────────────────────────────────
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits = (value || '').split('').concat(Array(6).fill('')).slice(0, 6)

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const arr = [...digits]; arr[i] = val
    onChange(arr.join(''))
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted.padEnd(6, '').slice(0, 6))
    inputs.current[Math.min(pasted.length, 5)]?.focus()
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={d} disabled={disabled}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: '48px', height: '56px',
            textAlign: 'center',
            fontSize: '1.5rem', fontWeight: 700,
            fontFamily: 'Outfit, monospace',
            background: 'var(--bg-elevated)',
            border: `2px solid ${d ? 'var(--color-primary)' : 'var(--bg-border)'}`,
            borderRadius: '12px',
            color: d ? 'white' : 'var(--text-muted)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: d ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Countdown Timer ───────────────────────────────────────────────────
function Countdown({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    const t = setInterval(() => setRemaining(r => {
      if (r <= 1) { clearInterval(t); onExpire(); return 0 }
      return r - 1
    }), 1000)
    return () => clearInterval(t)
  }, [])
  const m = Math.floor(remaining / 60), s = remaining % 60
  return (
    <span style={{ color: remaining < 30 ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 600 }}>
      {m}:{s.toString().padStart(2, '0')}
    </span>
  )
}

// ── Main Register Page ────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('register') // 'register' | 'otp'
  const [otp, setOtp] = useState('')
  const [otpExpired, setOtpExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [collegeName, setCollegeName] = useState('')
  const [formData, setFormData] = useState(null)

  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const emailValue = watch('email', '')

  // College detection as user types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (emailValue.includes('@') && emailValue.split('@')[1]?.includes('.')) {
        try {
          const res = await api.get(`/college/domain?email=${emailValue}`)
          setCollegeName(res.data.found ? res.data.collegeName : '')
        } catch { setCollegeName('') }
      } else setCollegeName('')
    }, 600)
    return () => clearTimeout(timer)
  }, [emailValue])

  // Step 1: Send OTP
  const onRegister = async (data) => {
    if (!collegeName) {
      toast.error('No college found for this email domain. Check with your admin.')
      return
    }
    setLoading(true)
    try {
      // Send OTP
      await api.post('/auth/send-otp', { email: data.email, name: data.name })
      setFormData(data)
      setRegisteredEmail(data.email)
      setPhase('otp')
      toast.success('OTP sent to your email! Check inbox 📧')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP & Create Account
  const verifyOtp = async () => {
    if (otp.length < 6) { toast.error('Enter the 6-digit OTP'); return }
    setLoading(true)
    try {
      // Complete registration with form data and OTP
      await api.post('/auth/register', { ...formData, otp })
      toast.success('Account verified and created! 🎉 Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const resendOtp = async () => {
    try {
      await api.post('/auth/resend-otp', { email: registeredEmail, name: '' })
      setOtp('')
      setOtpExpired(false)
      toast.success('New OTP sent!')
    } catch { toast.error('Failed to resend OTP') }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden'
    }}>
      {/* bg glow */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '700px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-fadeInUp">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'
            }}>
              <div style={{
                width: '44px', height: '44px', background: 'var(--gradient-brand)',
                borderRadius: '14px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.4rem'
              }}>📚</div>
              <span style={{
                fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.75rem'
              }}>SmartLMS</span>
            </div>
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {phase === 'register' ? 'Create Student Account' : 'Verify Your Email'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {phase === 'register'
              ? 'Register with your college email to get started'
              : `OTP sent to ${registeredEmail}`}
          </p>
        </div>

        <div className="card-glass animate-fadeInUp" style={{ padding: '2rem', animationDelay: '0.1s' }}>

          {/* ====== PHASE: REGISTER ====== */}
          {phase === 'register' && (
            <form onSubmit={handleSubmit(onRegister)}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {collegeName && (
                <div style={{
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '10px', padding: '0.75rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.85rem', color: 'var(--color-success)'
                }}>
                  🏫 <strong>{collegeName}</strong>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g., Arjun Sharma"
                  {...register('name', { required: 'Name is required' })} />
                {errors.name && <span className="error-message">{errors.name.message}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">College Email *</label>
                <input id="register-email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  type="email" placeholder="yourname@college.edu"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Valid email required' }
                  })} />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div className="input-group">
                  <label className="input-label">Branch</label>
                  <input className="input" placeholder="e.g., CS"
                    {...register('branch')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Year</label>
                  <input className="input" placeholder="e.g., 2026"
                    {...register('enrollmentYear')} />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password *</label>
                <input id="register-password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  type="password" placeholder="Min. 6 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Min 6 chars' }
                  })} />
                {errors.password && <span className="error-message">{errors.password.message}</span>}
              </div>

              <button id="register-submit" type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: '0.5rem', padding: '0.875rem' }}
                disabled={loading || !collegeName}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Sending OTP...
                  </span>
                ) : !collegeName ? 'Enter your college email to continue' : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* ====== PHASE: OTP VERIFY ====== */}
          {phase === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>

              <div style={{ fontSize: '3rem' }}>📨</div>

              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                We've sent a 6-digit OTP to<br />
                <strong style={{ color: 'var(--text-primary)' }}>{registeredEmail}</strong>
              </p>

              <OTPInput value={otp} onChange={setOtp} disabled={loading} />

              {!otpExpired ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  OTP expires in{' '}
                  <Countdown seconds={600} onExpire={() => setOtpExpired(true)} />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
                    OTP expired!
                  </p>
                  <button className="btn btn-outline btn-sm" onClick={resendOtp}>
                    Resend OTP
                  </button>
                </div>
              )}

              <button id="verify-otp-btn"
                className="btn btn-primary btn-full"
                style={{ width: '100%', padding: '0.875rem' }}
                onClick={verifyOtp} disabled={loading || otp.length < 6 || otpExpired}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    Verifying...
                  </span>
                ) : '✓ Verify & Activate Account'}
              </button>

              {!otpExpired && (
                <button type="button"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.8rem'
                  }}
                  onClick={resendOtp}>
                  Didn't receive? Resend OTP
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
