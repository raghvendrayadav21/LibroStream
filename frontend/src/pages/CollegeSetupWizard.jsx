import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../api/axios'
import ThemeToggle from '../components/ThemeToggle'

const STEPS = ['College Info', 'Admin Account', 'Library Config']

export default function CollegeSetupWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkingCode, setCheckingCode] = useState(false)
  const [codeAvailable, setCodeAvailable] = useState(null)
  const [nameAvailable, setNameAvailable] = useState(null)
  const [checkingName, setCheckingName] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [formData, setFormData] = useState({})

  const { register, handleSubmit, formState: { errors }, watch, trigger, getValues } = useForm({ mode: 'onChange' })

  // Check college code availability
  const checkCollegeCode = async () => {
    const code = getValues('collegeCode')
    if (!code || code.trim().length < 3) {
      setCodeAvailable(null)
      return
    }
    setCheckingCode(true)
    try {
      const res = await api.get(`/college/check-code?code=${code.trim()}`)
      setCodeAvailable(res.data.available)
    } catch {
      setCodeAvailable(null)
    } finally {
      setCheckingCode(false)
    }
  }

  // Check college name availability
  const checkCollegeName = async () => {
    const name = getValues('collegeName')
    if (!name || name.trim().length < 3) {
      setNameAvailable(null)
      return
    }
    setCheckingName(true)
    try {
      const res = await api.get(`/college/check-name?name=${encodeURIComponent(name.trim())}`)
      setNameAvailable(res.data.available)
    } catch {
      setNameAvailable(null)
    } finally {
      setCheckingName(false)
    }
  }

  // Handle logo upload → convert to Base64
  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
      setFormData(prev => ({ ...prev, logoBase64: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  // Next step
  const handleNext = async () => {
    const fields = step === 0
      ? ['collegeName', 'collegeCode', 'address', 'city']
      : step === 1
      ? ['adminName', 'adminEmail', 'adminPassword']
      : ['allowedEmailDomain']

    const valid = await trigger(fields)
    if (!valid) return

    if (step === 0) {
      if (nameAvailable === null) await checkCollegeName()
      if (codeAvailable === null) await checkCollegeCode()

      const isNameOk = nameAvailable ?? true
      const isCodeOk = codeAvailable ?? true

      if (!isNameOk) {
        toast.error('College name is already registered!')
        return
      }
      if (!isCodeOk) {
        toast.error('College code is already taken!')
        return
      }
    }

    setFormData(prev => ({ ...prev, ...getValues() }))
    setStep(s => s + 1)
  }

  // Final submit
  const onSubmit = async (data) => {
    setLoading(true)
    const payload = {
      ...formData, ...data,
      logoBase64: formData.logoBase64 || null,
      penaltyPerDay: parseFloat(data.penaltyPerDay) || 5.0,
      loanDurationDays: parseInt(data.loanDurationDays) || 14,
    }
    try {
      await api.post('/college/register', payload)
      toast.success('College registered successfully! Please login.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message;
      if (msg && (msg.toLowerCase().includes('already taken') || msg.toLowerCase().includes('already registered'))) {
        toast.error(`${msg} Please use a different College Code or Allowed Email Domain.`);
      } else {
        toast.error(msg || 'Registration failed. This college code or email domain might already be registered.');
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative'
    }}>
      {/* Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '560px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '40px', height: '40px', background: 'var(--gradient-brand)',
              borderRadius: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.25rem'
            }}>📚</div>
            <span style={{
              fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: '1.5rem'
            }}>SmartLMS</span>
          </div>
          <h1 style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Register Your College
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator" style={{ marginBottom: '2rem' }}>
          {STEPS.map((label, i) => (
            <div key={label} className="step" style={{ flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`step-line ${i < step ? 'done' : ''}`} />
                )}
              </div>
              <span style={{
                fontSize: '0.7rem', marginTop: '0.5rem',
                color: i === step ? 'var(--color-primary-light)' : 'var(--text-muted)',
                fontWeight: i === step ? 600 : 400,
                textAlign: 'center', whiteSpace: 'nowrap'
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="card-glass" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ====== STEP 0: College Info ====== */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>
                  🏫 College Details
                </h2>

                <div className="input-group">
                  <label className="input-label">College Name *</label>
                  <input className={`input ${errors.collegeName ? 'input-error' : ''}`}
                    placeholder="e.g., MIT College of Engineering, Indore"
                    {...register('collegeName', { required: 'College name is required', onBlur: checkCollegeName })} />
                  {errors.collegeName && <span className="error-message">{errors.collegeName.message}</span>}
                  {nameAvailable === false && (
                    <span className="error-message">✗ College name already registered. Choose another.</span>
                  )}
                  {nameAvailable === true && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>✓ Name is available!</span>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">
                    College Code * &nbsp;
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      (3–10 chars, used for login)
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className={`input ${errors.collegeCode ? 'input-error' : ''}`}
                      placeholder="e.g., MITIND"
                      style={{ textTransform: 'uppercase' }}
                      {...register('collegeCode', {
                        required: 'Required', minLength: { value: 3, message: 'Min 3 chars' },
                        maxLength: { value: 10, message: 'Max 10 chars' },
                        onBlur: checkCollegeCode
                      })} />
                    <button type="button" className="btn btn-outline btn-sm"
                      style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                      onClick={checkCollegeCode} disabled={checkingCode}>
                      {checkingCode ? '...' : 'Check'}
                    </button>
                  </div>
                  {errors.collegeCode && <span className="error-message">{errors.collegeCode.message}</span>}
                  {codeAvailable === true && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>✓ Code is available!</span>
                  )}
                  {codeAvailable === false && (
                    <span className="error-message">✗ Code already taken. Choose another.</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">City</label>
                    <input className="input" placeholder="e.g., Indore"
                      {...register('city')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">State</label>
                    <input className="input" placeholder="e.g., Madhya Pradesh"
                      {...register('address')} />
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="input-group">
                  <label className="input-label">College Logo (Optional)</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'var(--bg-elevated)',
                    border: '1.5px dashed var(--bg-border)',
                    borderRadius: '12px', padding: '1rem',
                    cursor: 'pointer', transition: 'border-color 0.2s'
                  }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview"
                        style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                    ) : (
                      <div style={{
                        width: '48px', height: '48px', background: 'var(--bg-card)',
                        borderRadius: '8px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.5rem'
                      }}>🖼️</div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {logoPreview ? 'Logo uploaded ✓' : 'Click to upload logo'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        PNG, JPG (shown on student library card)
                      </div>
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
            )}

            {/* ====== STEP 1: Admin Account ====== */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>
                  👤 Admin Account
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
                  This will be the Faculty Admin account for your college
                </p>

                <div className="input-group">
                  <label className="input-label">Admin Name *</label>
                  <input className={`input ${errors.adminName ? 'input-error' : ''}`}
                    placeholder="e.g., Dr. Rajesh Kumar"
                    {...register('adminName', { required: 'Required' })} />
                  {errors.adminName && <span className="error-message">{errors.adminName.message}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Admin Email *</label>
                  <input className={`input ${errors.adminEmail ? 'input-error' : ''}`}
                    type="email" placeholder="e.g., librarian@mitindore.edu"
                    {...register('adminEmail', {
                      required: 'Required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Valid email required' }
                    })} />
                  {errors.adminEmail && <span className="error-message">{errors.adminEmail.message}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Password *</label>
                  <input className={`input ${errors.adminPassword ? 'input-error' : ''}`}
                    type="password" placeholder="Min. 6 characters"
                    {...register('adminPassword', {
                      required: 'Required',
                      minLength: { value: 6, message: 'Min 6 characters' }
                    })} />
                  {errors.adminPassword && <span className="error-message">{errors.adminPassword.message}</span>}
                </div>

                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '10px', padding: '0.875rem', fontSize: '0.8rem',
                  color: 'var(--text-secondary)', lineHeight: 1.6
                }}>
                  💡 This admin account will have full control: manage books, scan student QR codes,
                  issue/return books, and configure college settings.
                </div>
              </div>
            )}

            {/* ====== STEP 2: Library Config ====== */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 className="heading-md" style={{ marginBottom: '0.5rem' }}>
                  ⚙️ Library Configuration
                </h2>

                <div className="input-group">
                  <label className="input-label">
                    Allowed Email Domain *
                  </label>
                  <input className={`input ${errors.allowedEmailDomain ? 'input-error' : ''}`}
                    placeholder="@mitindore.edu"
                    {...register('allowedEmailDomain', {
                      required: 'Required',
                      pattern: {
                        value: /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Format: @college.edu'
                      }
                    })} />
                  {errors.allowedEmailDomain && (
                    <span className="error-message">{errors.allowedEmailDomain.message}</span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Only emails ending with this domain can register as students
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Fine Per Day (₹)</label>
                    <input className="input" type="number" min="0" step="0.5"
                      defaultValue={5} {...register('penaltyPerDay')} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Loan Duration (days)</label>
                    <input className="input" type="number" min="1" max="90"
                      defaultValue={14} {...register('loanDurationDays')} />
                  </div>
                </div>

                {/* Summary Card */}
                <div style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '12px', padding: '1.25rem'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-success)' }}>
                    ✓ Setup Summary
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>🏫 <strong style={{ color: 'var(--text-primary)' }}>{formData.collegeName}</strong></div>
                    <div>🔑 Code: <strong style={{ color: 'var(--text-primary)' }}>{formData.collegeCode?.toUpperCase()}</strong></div>
                    <div>👤 Admin: <strong style={{ color: 'var(--text-primary)' }}>{formData.adminEmail}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* ====== NAVIGATION BUTTONS ====== */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
              {step > 0 && (
                <button type="button" className="btn btn-outline"
                  style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>
                  ← Back
                </button>
              )}
              {step < 2 ? (
                <button type="button" className="btn btn-primary"
                  style={{ flex: 2 }} onClick={handleNext}>
                  Continue →
                </button>
              ) : (
                <button type="submit" className="btn btn-primary"
                  style={{ flex: 2 }} disabled={loading} id="college-register-submit">
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      Registering...
                    </span>
                  ) : '🎉 Register College'}
                </button>
              )}
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-light)', textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
