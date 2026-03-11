import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ToastContainer, toast } from '../components/Toast'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

function CustomerModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState(customer || { name: '', street: '', city: '', country: 'United Arab Emirates', vat_number: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Customer name is required'); return }
    setSaving(true)
    let error
    if (customer?.id) {
      ({ error } = await supabase.from('customers').update(form).eq('id', customer.id))
    } else {
      ({ error } = await supabase.from('customers').insert([form]))
    }
    setSaving(false)
    if (error) { toast.error('Failed to save customer'); return }
    toast.success(customer?.id ? 'Customer updated' : 'Customer added')
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{customer?.id ? 'Edit Customer' : 'New Customer'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Customer Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sharjah City for Humanitarian Services" />
          </div>
          <div className="form-group">
            <label className="form-label">Street</label>
            <input className="form-input" value={form.street} onChange={e => set('street', e.target.value)} placeholder="e.g. Maliha Street" />
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Sharjah" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">VAT Number</label>
            <input className="form-input" value={form.vat_number} onChange={e => set('vat_number', e.target.value)} placeholder="e.g. 100581956800003" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}><X size={14} /> Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
            {customer?.id ? 'Update' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | customer obj

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { toast.error('Cannot delete — customer may be in use'); return }
    toast.success('Customer deleted')
    load()
  }

  return (
    <>
      <ToastContainer />
      {modal !== null && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}

      <div className="page-header">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-subtitle">Manage receiver addresses for invoices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <h3>No customers yet</h3>
              <p>Add your first customer to use in invoices</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('new')}><Plus size={14} /> Add Customer</button>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>VAT Number</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>
                        {[c.street, c.city, c.country].filter(Boolean).join(', ')}
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{c.vat_number || '—'}</td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(c)}><Pencil size={14} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(c.id, c.name)}><Trash2 size={14} /></button>
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
