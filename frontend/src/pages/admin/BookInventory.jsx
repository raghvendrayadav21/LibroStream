import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

export default function BookInventory() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [bulkJson, setBulkJson] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm()

  useEffect(() => { fetchBooks() }, [])

  const fetchBooks = async () => {
    try {
      const res = await api.get('/admin/books')
      setBooks(res.data || [])
    } catch { toast.error('Failed to load books') }
    finally { setLoading(false) }
  }

  const fetchWithSearch = async (q) => {
    try {
      const res = await api.get(`/admin/books?search=${q}`)
      setBooks(res.data || [])
    } catch {}
  }

  const handleSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    if (q.length > 1) fetchWithSearch(q)
    else if (q.length === 0) fetchBooks()
  }

  const addBook = async (data) => {
    setSubmitting(true)
    try {
      const res = await api.post('/admin/books', {
        ...data,
        totalCopies: parseInt(data.totalCopies) || 1
      })
      setBooks(prev => [res.data, ...prev])
      toast.success(`"${data.title}" added! ✅`)
      reset()
      setShowAddForm(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add book')
    } finally { setSubmitting(false) }
  }

  const bulkAdd = async () => {
    try {
      const arr = JSON.parse(bulkJson)
      if (!Array.isArray(arr)) { toast.error('Must be a JSON array'); return }
      setSubmitting(true)
      const res = await api.post('/admin/books/bulk', arr)
      setBooks(prev => [...res.data, ...prev])
      toast.success(`${res.data.length} books added! 🎉`)
      setBulkJson('')
      setShowBulk(false)
    } catch (e) {
      toast.error('Invalid JSON or server error: ' + e.message)
    } finally { setSubmitting(false) }
  }

  const deleteBook = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      await api.delete(`/admin/books/${id}`)
      setBooks(prev => prev.filter(b => b.id !== id))
      toast.success('Book deleted.')
    } catch { toast.error('Delete failed.') }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="heading-lg">📖 Book Inventory</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {books.length} book titles in your library
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setShowBulk(!showBulk); setShowAddForm(false) }}>
              📦 Bulk Upload
            </button>
            <button id="add-book-btn" className="btn btn-primary btn-sm" onClick={() => { setShowAddForm(!showAddForm); setShowBulk(false) }}>
              + Add Book
            </button>
          </div>
        </div>

        {/* Add Single Book Form */}
        {showAddForm && (
          <div className="card animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
            <h3 className="heading-md" style={{ marginBottom: '1.25rem' }}>➕ Add New Book</h3>
            <form onSubmit={handleSubmit(addBook)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className={`input ${errors.title ? 'input-error' : ''}`}
                    placeholder="Book title"
                    {...register('title', { required: true })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Author *</label>
                  <input className={`input ${errors.author ? 'input-error' : ''}`}
                    placeholder="Author name"
                    {...register('author', { required: true })} />
                </div>
                <div className="input-group">
                  <label className="input-label">ISBN</label>
                  <input className="input" placeholder="ISBN number"
                    {...register('isbn')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Category</label>
                  <input className="input" placeholder="e.g., Computer Science"
                    {...register('category')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Copies</label>
                  <input className="input" type="number" min="1" defaultValue={1}
                    {...register('totalCopies')} />
                </div>
                <div className="input-group">
                  <label className="input-label">Shelf Location</label>
                  <input className="input" placeholder="e.g., Rack-B3"
                    {...register('shelfLocation')} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : '✅ Add Book'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Upload */}
        {showBulk && (
          <div className="card animate-fadeInUp" style={{ marginBottom: '1.5rem' }}>
            <h3 className="heading-md" style={{ marginBottom: '0.75rem' }}>📦 Bulk Upload (JSON Array)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Paste a JSON array of books:
              <code style={{ background: 'var(--bg-elevated)', padding: '0.2rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                {`[{"title":"...", "author":"...", "totalCopies": 1}]`}
              </code>
            </p>
            <textarea className="input" rows={6} value={bulkJson}
              onChange={e => setBulkJson(e.target.value)}
              placeholder='[{"title": "Introduction to Java", "author": "Schildt", "category": "CS", "totalCopies": 3}]'
              style={{ fontFamily: 'monospace', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={bulkAdd} disabled={submitting || !bulkJson.trim()}>
                {submitting ? 'Uploading...' : '📥 Upload Books'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowBulk(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '1.25rem', position: 'relative', maxWidth: '400px' }}>
          <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input className="input" placeholder="Search by title or author..."
            value={search} onChange={handleSearch}
            style={{ paddingLeft: '2.5rem' }} />
        </div>

        {/* Books Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : books.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem',
            background: 'var(--bg-card)', borderRadius: '16px',
            border: '1px solid var(--bg-border)', color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <p>No books found. Add some books to get started!</p>
          </div>
        ) : (
          <div className="table-wrapper animate-fadeIn">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book, i) => (
                  <tr key={book.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      {book.isbn && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ISBN: {book.isbn}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{book.author}</td>
                    <td>{book.category ? <span className="badge badge-info">{book.category}</span> : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{book.totalCopies}</td>
                    <td>
                      <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {book.availableCopies}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{book.shelfLocation || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => deleteBook(book.id, book.title)}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
