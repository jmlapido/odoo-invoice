import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PasswordGate from './pages/PasswordGate'
import Dashboard from './pages/Dashboard'
import InvoiceForm from './pages/InvoiceForm'
import InvoicePreview from './pages/InvoicePreview'
import CustomersPage from './pages/CustomersPage'
import BankDetailsPage from './pages/BankDetailsPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { authed } = useAuth()
  return authed ? children : <Navigate to="/" replace />
}

export default function App() {
  const { authed } = useAuth()

  return (
    <Routes>
      <Route path="/" element={authed ? <Navigate to="/dashboard" replace /> : <PasswordGate />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/invoice/new" element={<ProtectedRoute><Layout><InvoiceForm /></Layout></ProtectedRoute>} />
      <Route path="/invoice/:id/edit" element={<ProtectedRoute><Layout><InvoiceForm /></Layout></ProtectedRoute>} />
      <Route path="/invoice/:id/preview" element={<ProtectedRoute><InvoicePreview /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Layout><CustomersPage /></Layout></ProtectedRoute>} />
      <Route path="/bank-details" element={<ProtectedRoute><Layout><BankDetailsPage /></Layout></ProtectedRoute>} />
    </Routes>
  )
}
