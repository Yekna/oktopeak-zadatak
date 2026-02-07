import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMedication, type MedicationDetail as MedicationDetailType } from '../api'

function typeBadge(type: string) {
  const cls = type === 'CHECKOUT' ? 'badge-checkout' : type === 'RETURN' ? 'badge-return' : 'badge-waste'
  return <span className={`badge ${cls}`}>{type}</span>
}

export default function MedicationDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [med, setMed] = useState<MedicationDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getMedication(slug)
      .then(res => setMed(res.data))
      .catch(err => setError(err?.error || 'Failed to load medication'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <p className="loading">Loading...</p>
  if (error) return <div className="error">{error}</div>
  if (!med) return <div className="error">Medication not found</div>

  return (
    <>
      <Link to="/medications" className="back-link">&larr; Back to Medications</Link>
      <h1>{med.name}</h1>

      <div className="detail-header">
        <div className="field">
          <span className="label">Schedule</span>
          <span className="value">{med.schedule}</span>
        </div>
        <div className="field">
          <span className="label">Unit</span>
          <span className="value">{med.unit}</span>
        </div>
        <div className="field">
          <span className="label">Stock</span>
          <span className="value">{med.stockQuantity}</span>
        </div>
        <div className="field">
          <span className="label">Slug</span>
          <span className="value">{med.slug}</span>
        </div>
      </div>

      <h2>Transaction History</h2>
      {med.transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Quantity</th>
              <th>Nurse</th>
              <th>Witness</th>
              <th>Notes</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {med.transactions.map(tx => (
              <tr key={tx.id}>
                <td>{typeBadge(tx.type)}</td>
                <td>{tx.quantity}</td>
                <td>{tx.nurse.name}</td>
                <td>{tx.witness.name}</td>
                <td>{tx.notes || '-'}</td>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
