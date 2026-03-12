import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PasswordGate from './pages/PasswordGate'
import Dashboard from './pages/Dashboard'
import InvoiceForm from './pages/InvoiceForm'
import InvoicePreview from './pages/InvoicePreview'
import CustomersPage from './pages/CustomersPage'
import BankDetailsPage from './pages/BankDetailsPage'
import ShippingAddressesPage from './pages/ShippingAddressesPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { authed } = useAuth()
  return authed ? children : <Navigate to="/" replace />
}

export default function App() {
  const { authed } = useAuth()

  const router = createBrowserRouter([
    {
      path: "/",
      element: authed ? <Navigate to="/dashboard" replace /> : <PasswordGate />
    },
    {
      path: "/dashboard",
      element: <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
    },
    {
      path: "/invoice/new",
      element: <ProtectedRoute><Layout><InvoiceForm /></Layout></ProtectedRoute>
    },
    {
      path: "/invoice/:id/edit",
      element: <ProtectedRoute><Layout><InvoiceForm /></Layout></ProtectedRoute>
    },
    {
      path: "/invoice/:id/preview",
      element: <ProtectedRoute><InvoicePreview /></ProtectedRoute>
    },
    {
      path: "/customers",
      element: <ProtectedRoute><Layout><CustomersPage /></Layout></ProtectedRoute>
    },
    {
      path: "/bank-details",
      element: <ProtectedRoute><Layout><BankDetailsPage /></Layout></ProtectedRoute>
    },
    {
      path: "/shipping-addresses",
      element: <ProtectedRoute><Layout><ShippingAddressesPage /></Layout></ProtectedRoute>
    },
  ])

  return <RouterProvider router={router} />
}
