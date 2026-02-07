import { useEffect, useState } from 'react'
import { getAuditLog, type AuditLogEntry, type Pagination } from '../api'

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAuditLog({
        page,
        entityType: entityType || undefined,
      })
      setEntries(res.data)
      setPagination(res.pagination)
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'error' in err ? String((err as { error: string }).error) : 'Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, entityType])

  return (
    <>
      <h1>Audit Log</h1>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <label>Entity Type:</label>
        <select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1) }}>
          <option value="">All</option>
          <option value="Transaction">Transaction</option>
          <option value="Medication">Medication</option>
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Performed By</th>
              <th>Details</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td>{entry.action}</td>
                <td>{entry.entityType}</td>
                <td title={entry.entityId}>{entry.entityId.slice(0, 8)}...</td>
                <td>{entry.performedBy.name}</td>
                <td title={JSON.stringify(entry.details, null, 2)}>
                  {summarizeDetails(entry.details)}
                </td>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={6}>No audit log entries found.</td></tr>
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

function summarizeDetails(details: Record<string, unknown>): string {
  const parts: string[] = []
  if (details.medicationName) parts.push(String(details.medicationName))
  if (details.transactionType) parts.push(String(details.transactionType))
  if (details.quantity) parts.push(`qty: ${details.quantity}`)
  return parts.join(' | ') || JSON.stringify(details).slice(0, 50)
}
