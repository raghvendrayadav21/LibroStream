import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { BrowserQRCodeReader } from '@zxing/browser'

export default function QRScanner() {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualId, setManualId] = useState('')
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)
  const controlsRef = useRef(null)

  // Start Camera
  const startScanner = async () => {
    setScanning(true)
    setStudent(null)
    try {
      codeReaderRef.current = new BrowserQRCodeReader()
      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      if (!devices.length) {
        toast.error('No camera found!')
        setScanning(false)
        return
      }
      controlsRef.current = await codeReaderRef.current.decodeFromVideoDevice(
        undefined, // default camera
        videoRef.current,
        async (result, err) => {
          if (result) {
            const text = result.getText()
            if (text.startsWith('SMARTLMS:')) {
              stopScanner()
              await lookupByQR(text)
            }
          }
        }
      )
    } catch (err) {
      toast.error('Camera access denied or unavailable.')
      setScanning(false)
    }
  }

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => () => stopScanner(), [])

  // QR Content → Student Lookup
  const lookupByQR = async (qrContent) => {
    setLoading(true)
    try {
      const parts = qrContent.split(':')
      const studentId = parts[1]
      const res = await api.get(`/admin/student/${studentId}`)
      setStudent(res.data)
      toast.success('Student profile loaded! ✅')
    } catch {
      toast.error('Student not found or invalid QR code.')
    } finally { setLoading(false) }
  }

  // Manual ID lookup
  const lookupManual = async () => {
    if (!manualId.trim()) return
    setLoading(true)
    try {
      const res = await api.get(`/admin/student/${manualId.trim()}`)
      setStudent(res.data)
    } catch {
      toast.error('Student not found.')
    } finally { setLoading(false) }
  }

  // Issue book from student profile
  const issueBook = async (bookId) => {
    if (!bookId.trim()) { toast.error('Enter Book ID'); return }
    try {
      await api.post('/admin/issue', { studentId: student.id, bookId: bookId.trim() })
      toast.success('Book issued successfully! 📚')
      const res = await api.get(`/admin/student/${student.id}`)
      setStudent(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Issue failed.')
    }
  }

  // Return book
  const returnBook = async (txnId) => {
    try {
      await api.put(`/admin/return/${txnId}`)
      toast.success('Book returned successfully! ✅')
      const res = await api.get(`/admin/student/${student.id}`)
      setStudent(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Return failed.')
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="heading-lg">📷 QR Code Scanner</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Scan student QR code to instantly load their profile
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Scanner Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Camera View */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
              borderRadius: '16px', overflow: 'hidden', aspectRatio: '1'
            }}>
              {scanning ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Scanner overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '200px', height: '200px',
                      border: '3px solid var(--color-primary)',
                      borderRadius: '16px',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    }}>
                      {/* Corner marks */}
                      {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
                        <div key={pos} style={{
                          position: 'absolute',
                          width: '20px', height: '20px',
                          borderColor: 'var(--color-primary)',
                          borderStyle: 'solid',
                          borderWidth: pos.includes('top') ? '3px 0 0' : '0 0 3px',
                          borderRightWidth: pos.includes('right') ? '3px' : '0',
                          borderLeftWidth: pos.includes('left') ? '3px' : '0',
                          ...(pos === 'top-left' ? { top: -1, left: -1 } : {}),
                          ...(pos === 'top-right' ? { top: -1, right: -1 } : {}),
                          ...(pos === 'bottom-left' ? { bottom: -1, left: -1 } : {}),
                          ...(pos === 'bottom-right' ? { bottom: -1, right: -1 } : {}),
                        }} />
                      ))}
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    padding: '0.4rem 1rem', borderRadius: '999px',
                    fontSize: '0.8rem', backdropFilter: 'blur(4px)'
                  }}>
                    Point camera at student's QR code
                  </div>
                </div>
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)', gap: '1rem',
                  minHeight: '280px'
                }}>
                  <div style={{ fontSize: '4rem' }}>📷</div>
                  <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
                    Camera is off.<br />Click "Start Scanning" to begin.
                  </p>
                </div>
              )}
            </div>

            {/* Scanner Controls */}
            {!scanning ? (
              <button id="start-scan-btn" className="btn btn-primary btn-full"
                onClick={startScanner} disabled={loading} style={{ padding: '0.875rem' }}>
                📷 Start Camera Scanner
              </button>
            ) : (
              <button className="btn btn-danger btn-full" onClick={stopScanner} style={{ padding: '0.875rem' }}>
                ⏹ Stop Scanner
              </button>
            )}

            {/* Divider */}
            <div className="divider">or enter manually</div>

            {/* Manual Student ID */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" placeholder="Enter Student ID..."
                value={manualId} onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupManual()}
              />
              <button className="btn btn-outline" onClick={lookupManual} disabled={loading}>
                {loading ? <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : 'Go'}
              </button>
            </div>
          </div>

          {/* Student Profile Panel */}
          {loading && !student && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <div className="spinner" />
            </div>
          )}

          {student && !loading && (
            <div className="animate-fadeInUp" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Header */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '64px', height: '64px',
                    background: 'var(--gradient-brand)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0
                  }}>
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                      {student.name}
                    </h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{student.email}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {student.branch && <span className="badge badge-info">{student.branch}</span>}
                      <span className="badge badge-muted">🪪 {student.libraryCardNumber}</span>
                    </div>
                  </div>
                  {student.totalPendingPenalty > 0 && (
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Fine</div>
                      <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-danger)' }}>
                        ₹{student.totalPendingPenalty.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Issue Book Form */}
                <IssueBookForm studentId={student.id} onIssue={issueBook} />
              </div>

              {/* Active Books */}
              {student.activeBooks?.length > 0 && (
                <div>
                  <h3 className="heading-md" style={{ marginBottom: '1rem' }}>
                    📚 Books Currently Issued ({student.activeBooks.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {student.activeBooks.map(book => (
                      <div key={book.id} style={{
                        background: book.isOverdue ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)',
                        border: `1px solid ${book.isOverdue ? 'rgba(239,68,68,0.25)' : 'var(--bg-border)'}`,
                        borderRadius: '14px', padding: '1rem',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{book.bookTitle}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Issued: {book.issueDate} · Due: {' '}
                            <span style={{ color: book.isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: book.isOverdue ? 600 : 400 }}>
                              {book.dueDate}
                            </span>
                            {book.isOverdue && ` (${book.daysLate} days late · ₹${book.livePenalty?.toFixed(2)} fine)`}
                          </div>
                        </div>
                        <button id={`return-btn-${book.id}`}
                          className="btn btn-success btn-sm"
                          onClick={() => returnBook(book.id)}>
                          ↩ Return
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {student.activeBooks?.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2rem',
                  background: 'var(--bg-card)', borderRadius: '14px',
                  border: '1px solid var(--bg-border)', color: 'var(--text-muted)'
                }}>
                  <span style={{ fontSize: '2rem' }}>📭</span>
                  <p style={{ marginTop: '0.5rem' }}>No books currently issued to this student.</p>
                </div>
              )}
            </div>
          )}

          {!student && !loading && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '300px', color: 'var(--text-muted)',
              textAlign: 'center', gap: '1rem'
            }}>
              <div style={{ fontSize: '5rem', opacity: 0.3 }}>👤</div>
              <div>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  No student loaded yet
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  Scan a QR code or enter a student ID to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Issue Book Form Component
function IssueBookForm({ studentId, onIssue }) {
  const [bookId, setBookId] = useState('')

  return (
    <div style={{
      background: 'var(--bg-elevated)', borderRadius: '12px',
      padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end'
    }}>
      <div className="input-group" style={{ flex: 1 }}>
        <label className="input-label">Issue a Book (Enter Book ID)</label>
        <input className="input" placeholder="e.g., Book MongoDB ID..."
          value={bookId} onChange={e => setBookId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onIssue(bookId)}
        />
      </div>
      <button id="issue-book-btn" className="btn btn-primary"
        onClick={() => { onIssue(bookId); setBookId('') }} disabled={!bookId.trim()}>
        📚 Issue Book
      </button>
    </div>
  )
}
