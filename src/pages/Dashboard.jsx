import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatAED } from '../lib/utils'
import { ToastContainer, toast } from '../components/Toast'
import { Plus, FileText, Eye, Pencil, Trash2, Search } from 'lucide-react'

export default function Dashboard() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadInvoices() }, [])

  const loadInvoices = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })
    if (!error) setInvoices(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, number) => {
    if (!confirm(`Delete invoice ${number}? This cannot be undone.`)) return
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) { toast.error('Failed to delete invoice'); return }
    toast.success(`Invoice ${number} deleted`)
    loadInvoices()
  }

  const filtered = invoices.filter(inv =>
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customers?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

  return (
    <>
      <ToastContainer />
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Manage your tax invoices</div>
        </div>
        <Link to="/invoice/new" className="btn btn-primary">
          <Plus size={15} /> New Invoice
        </Link>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-label">Total Invoices</div>
            <div className="stat-value">{invoices.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value" style={{ fontSize: 18 }}>{formatAED(totalRevenue)}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {/* Top bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h3>{search ? 'No matching invoices' : 'No invoices yet'}</h3>
              <p>{search ? 'Try a different search term' : 'Create your first invoice to get started'}</p>
              {!search && <Link to="/invoice/new" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}><Plus size={14} /> New Invoice</Link>}
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={14} color="var(--accent2)" />
                          <span style={{ fontWeight: 600, color: 'var(--accent2)' }}>{inv.invoice_number}</span>
                        </div>
                      </td>
                      <td>{inv.customers?.name || '—'}</td>
                      <td>{formatDate(inv.invoice_date)}</td>
                      <td>{formatDate(inv.due_date)}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>{formatAED(inv.total)}</td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <Link to={`/invoice/${inv.id}/preview`} className="btn btn-ghost btn-sm btn-icon" title="Preview PDF">
                            <Eye size={14} />
                          </Link>
                          <Link to={`/invoice/${inv.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="Edit">
                            <Pencil size={14} />
                          </Link>
                          <button className="btn btn-ghost btn-sm btn-icon text-danger" title="Delete" onClick={() => handleDelete(inv.id, inv.invoice_number)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
