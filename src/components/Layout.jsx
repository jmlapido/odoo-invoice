import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FileText, Users, Building2, LayoutDashboard, LogOut } from 'lucide-react'

export default function Layout({ children }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🌙</div>
          <div>
            <div className="sidebar-brand-text">Invoice Generator</div>
            <div className="sidebar-brand-sub">Silentnight UAE LLC</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Main</div>

          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <NavLink to="/invoice/new" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <FileText size={16} />
            New Invoice
          </NavLink>

          <div className="sidebar-section">Settings</div>

          <NavLink to="/customers" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Users size={16} />
            Customers
          </NavLink>

          <NavLink to="/bank-details" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Building2 size={16} />
            Bank Details
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost w-full" style={{ justifyContent: 'flex-start', gap: 10, fontSize: 13.5 }} onClick={handleLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
