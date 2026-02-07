import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Medications from './pages/Medications'
import MedicationDetail from './pages/MedicationDetail'
import Transactions from './pages/Transactions'
import AuditLog from './pages/AuditLog'
import './App.css'

export default function App() {
  return (
    <>
      <nav className="navbar">
        <span className="brand">Medication Inventory</span>
        <NavLink to="/medications">Medications</NavLink>
        <NavLink to="/transactions">Transactions</NavLink>
        <NavLink to="/audit-log">Audit Log</NavLink>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/medications" replace />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/medications/:slug" element={<MedicationDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Routes>
      </main>
    </>
  )
}
