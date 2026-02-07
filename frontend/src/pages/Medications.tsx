import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMedications, createMedication, type Medication, type Pagination } from '../api'
import slugify from 'slugify'

const SCHEDULES = ['', 'II', 'III', 'IV', 'V'] as const

export default function Medications() {
  const navigate = useNavigate()
  const [meds, setMeds] = useState<Medication[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [schedule, setSchedule] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [formSchedule, setFormSchedule] = useState('II')
  const [unit, setUnit] = useState('mg')
  const [stockQuantity, setStockQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMedications({
        page,
        schedule: schedule || undefined,
      })
      setMeds(res.data)
      setPagination(res.pagination)
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'error' in err ? String((err as { error: string }).error) : 'Failed to load medications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, schedule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const slug = slugify(name);

    try {
      await createMedication({
        name,
        slug,
        schedule: formSchedule,
        unit,
        stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
      })
      setSuccess(`Created "${name}" successfully`)
      setName('')
      setStockQuantity('')
      load()
    } catch (err: unknown) {
      const e = err as { error?: string; details?: { path: string; message: string }[] }
      setError(e.details ? e.details.map(d => `${d.path}: ${d.message}`).join(', ') : e.error || 'Failed to create medication')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Medications</h1>

      <div className="form-section">
        <h3>Create Medication</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Schedule</label>
              <select value={formSchedule} onChange={e => setFormSchedule(e.target.value)}>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
              </select>
            </div>
            <div className="form-field">
              <label>Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
              </select>
            </div>
            <div className="form-field">
              <label>Stock Qty</label>
              <input type="number" min="0" step="any" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} placeholder="0" />
            </div>
            <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="filters">
        <label>Schedule:</label>
        <select value={schedule} onChange={e => { setSchedule(e.target.value); setPage(1) }}>
          {SCHEDULES.map(s => (
            <option key={s} value={s}>{s || 'All'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Schedule</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Slug</th>
            </tr>
          </thead>
          <tbody>
            {meds.map(m => (
              <tr key={m.id} className="clickable" onClick={() => navigate(`/medications/${m.slug}`)}>
                <td>{m.name}</td>
                <td>{m.schedule}</td>
                <td>{m.unit}</td>
                <td>{m.stockQuantity}</td>
                <td>{m.slug}</td>
              </tr>
            ))}
            {meds.length === 0 && (
              <tr><td colSpan={5}>No medications found.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </>
  )
}
