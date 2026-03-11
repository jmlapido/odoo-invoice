import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ToastContainer, toast } from '../components/Toast'
import { Plus, Pencil, Trash2, X, Check, MapPin } from 'lucide-react'

function ShippingAddressModal({ address, onSave, onClose }) {
  const [form, setForm] = useState(address || { name: '', address_line1: '', address_line2: '', city: '', country: 'United Arab Emirates' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.address_line1.trim()) { toast.error('Address Line 1 is required'); return }
    if (!form.city.trim()) { toast.error('City is required'); return }
    
    setSaving(true)
    let error
    if (address?.id) {
      ({ error } = await supabase.from('shipping_addresses').update(form).eq('id', address.id))
    } else {
      ({ error } = await supabase.from('shipping_addresses').insert([form]))
    }
    setSaving(false)
    
    if (error) {
      console.error('Supabase Error:', error)
      toast.error(`Error: ${error.message || 'Failed to save shipping address'}`)
      return
    }
    
    toast.success(address?.id ? 'Shipping address updated' : 'Shipping address added')
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{address?.id ? 'Edit Shipping Address' : 'New Shipping Address'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Location Name (e.g. Warehouse A) *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Main Warehouse" />
          </div>
          <div className="form-group">
            <label className="form-label">Address Line 1 *</label>
            <input className="form-input" value={form.address_line1} onChange={e => set('address_line1', e.target.value)} placeholder="e.g. Al Ittihad Street" />
          </div>
          <div className="form-group">
            <label className="form-label">Address Line 2</label>
            <input className="form-input" value={form.address_line2} onChange={e => set('address_line2', e.target.value)} placeholder="e.g. PO BOX 2604" />
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. AJMAN" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}><X size={14} /> Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
            {address?.id ? 'Update' : 'Add Address'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShippingAddressesPage() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | address obj

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('shipping_addresses').select('*').order('name')
    setAddresses(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return
    
    const { error } = await supabase.from('shipping_addresses').delete().eq('id', id)
    if (error) {
      console.error('Delete Error:', error)
      toast.error('Cannot delete: ' + (error.message || 'Address may be in use'))
      return
    }
    toast.success('Shipping address deleted')
    load()
  }

  return (
    <>
      <ToastContainer />
      {modal !== null && (
        <ShippingAddressModal
          address={modal === 'new' ? null : modal}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}

      <div className="page-header">
        <div>
          <div className="page-title">Shipping Addresses</div>
          <div className="page-subtitle">Manage delivery locations for your invoices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Add Shipping Address
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner" /></div>
          ) : addresses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📍</div>
              <h3>No shipping addresses yet</h3>
              <p>Add shipping locations to select them when creating invoices</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('new')}><Plus size={14} /> Add Shipping Address</button>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>
                        {[a.address_line1, a.address_line2, a.city, a.country].filter(Boolean).join(', ')}
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(a)}><Pencil size={14} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(a.id, a.name)}><Trash2 size={14} /></button>
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
