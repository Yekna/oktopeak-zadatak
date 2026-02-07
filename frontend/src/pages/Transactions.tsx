import { useEffect, useState } from 'react'
import { getTransactions, createTransaction, getMedications, type Transaction, type Pagination, type Medication } from '../api'

const TYPES = ['', 'CHECKOUT', 'RETURN', 'WASTE'] as const

function typeBadge(type: string) {
  const cls = type === 'CHECKOUT' ? 'badge-checkout' : type === 'RETURN' ? 'badge-return' : 'badge-waste'
  return <span className={`badge ${cls}`}>{type}</span>
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Available medications for the form dropdown
  const [medications, setMedications] = useState<Medication[]>([])

  // Form state
  const [medicationId, setMedicationId] = useState('')
  const [nurseId, setNurseId] = useState('')
  const [witnessId, setWitnessId] = useState('')
  const [type, setType] = useState('CHECKOUT')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getTransactions({
        page,
        type: typeFilter || undefined,
      })
      setTransactions(res.data)
      setPagination(res.pagination)
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'error' in err ? String((err as { error: string }).error) : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, typeFilter])

  useEffect(() => {
    getMedications({ limit: 100 })
      .then(res => setMedications(res.data))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await createTransaction({
        medicationId,
        nurseId,
        witnessId,
        type,
        quantity: Number(quantity),
        notes: notes || undefined,
      })
      setSuccess('Transaction created successfully')
      setQuantity('')
      setNotes('')
      load()
    } catch (err: unknown) {
      const e = err as { error?: string; details?: { path: string; message: string }[] }
      setError(e.details ? e.details.map(d => `${d.path}: ${d.message}`).join(', ') : e.error || 'Failed to create transaction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Transactions</h1>

      <div className="form-section">
        <h3>Create Transaction</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Medication</label>
              <select value={medicationId} onChange={e => setMedicationId(e.target.value)} required>
                <option value="">Select...</option>
                {medications.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Type</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="CHECKOUT">CHECKOUT</option>
                <option value="RETURN">RETURN</option>
                <option value="WASTE">WASTE</option>
              </select>
            </div>
            <div className="form-field">
              <label>Quantity</label>
              <input type="number" min="1" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Nurse ID (UUID)</label>
              <input value={nurseId} onChange={e => setNurseId(e.target.value)} required placeholder="UUID" />
            </div>
            <div className="form-field">
              <label>Witness ID (UUID)</label>
              <input value={witnessId} onChange={e => setWitnessId(e.target.value)} required placeholder="UUID" />
            </div>
            <div className="form-field">
              <label>Notes {type === 'WASTE' && '(required)'}</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={type === 'WASTE' ? 'Required for WASTE' : 'Optional'} />
            </div>
            <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="filters">
        <label>Type:</label>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
          {TYPES.map(t => (
            <option key={t} value={t}>{t || 'All'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Medication</th>
              <th>Quantity</th>
              <th>Nurse</th>
              <th>Witness</th>
              <th>Notes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{typeBadge(tx.type)}</td>
                <td>{tx.medication.name}</td>
                <td>{tx.quantity}</td>
                <td>{tx.nurse.name}</td>
                <td>{tx.witness.name}</td>
                <td>{tx.notes || '-'}</td>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={7}>No transactions found.</td></tr>
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
