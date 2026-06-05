import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function CollegeSettings() {
  const [college, setCollege] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => { fetchCollege() }, [])

  const fetchCollege = async () => {
    try {
      const res = await api.get('/college/info')
      setCollege(res.data)
      setForm({
        collegeName: res.data.collegeName,
        address: res.data.address || '',
        city: res.data.city || '',
        allowedEmailDomain: res.data.allowedEmailDomain,
        penaltyPerDay: res.data.penaltyPerDay,
        loanDurationDays: res.data.loanDurationDays,
      })
      setLogoPreview(res.data.logoBase64 || null)
    } catch { toast.error('Failed to load college info') }
    finally { setLoading(false) }
  }

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
      setForm(prev => ({ ...prev, logoBase64: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const payload = { ...form, penaltyPerDay: parseFloat(form.penaltyPerDay), loanDurationDays: parseInt(form.loanDurationDays) }
      const res = await api.put('/college/settings', payload)
      setCollege(res.data)
      toast.success('Settings saved! ✅')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed.')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">⚙️ College Settings</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage your library configuration and college profile
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '900px' }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* College Info */}
            <div className="card">
              <h3 className="heading-md" style={{ marginBottom: '1.25rem' }}>🏫 College Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">College Name</label>
                  <input className="input" value={form.collegeName || ''}
                    onChange={e => handleChange('collegeName', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">City</label>
                  <input className="input" value={form.city || ''}
                    onChange={e => handleChange('city', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Address / State</label>
                  <input className="input" value={form.address || ''}
                    onChange={e => handleChange('address', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Library Config */}
            <div className="card">
              <h3 className="heading-md" style={{ marginBottom: '1.25rem' }}>📚 Library Rules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Allowed Email Domain</label>
                  <input className="input" value={form.allowedEmailDomain || ''}
                    onChange={e => handleChange('allowedEmailDomain', e.target.value)}
                    placeholder="@college.edu" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Only emails with this domain can register as students
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Fine per Day (₹)</label>
                    <input className="input" type="number" min="0" step="0.5"
                      value={form.penaltyPerDay || 5}
                      onChange={e => handleChange('penaltyPerDay', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Loan Duration (days)</label>
                    <input className="input" type="number" min="1" max="90"
                      value={form.loanDurationDays || 14}
                      onChange={e => handleChange('loanDurationDays', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Logo Upload */}
            <div className="card">
              <h3 className="heading-md" style={{ marginBottom: '1.25rem' }}>🖼️ College Logo</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Shown on students' digital library cards
              </p>
              {logoPreview && (
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <img src={logoPreview} alt="College logo"
                    style={{ maxHeight: '100px', maxWidth: '200px', objectFit: 'contain', borderRadius: '8px' }} />
                </div>
              )}
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.75rem', padding: '1.25rem',
                background: 'var(--bg-elevated)',
                border: '2px dashed var(--bg-border)',
                borderRadius: '12px', cursor: 'pointer',
                fontSize: '0.875rem', color: 'var(--text-secondary)',
                transition: 'border-color 0.2s'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📁</span>
                {logoPreview ? 'Click to change logo' : 'Click to upload logo (PNG/JPG)'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </label>
            </div>

            {/* College Stats Card */}
            <div className="card">
              <h3 className="heading-md" style={{ marginBottom: '1.25rem' }}>📊 Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'College Code', value: college?.collegeCode, icon: '🔑' },
                  { label: 'Admin Email', value: college?.adminEmail, icon: '👤' },
                  { label: 'Total Students', value: college?.totalStudents, icon: '👨‍🎓' },
                  { label: 'Total Books', value: college?.totalBooks, icon: '📚' },
                  { label: 'Books Issued', value: college?.issuedBooks, icon: '📖' },
                  { label: 'Overdue Books', value: college?.overdueBooks, icon: '⚠️' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '0.625rem 0.875rem',
                    background: 'var(--bg-elevated)', borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.icon} {item.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem' }}>
          <button id="save-settings-btn"
            className="btn btn-primary btn-lg"
            onClick={saveSettings} disabled={saving}>
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Saving...
              </span>
            ) : '💾 Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}
