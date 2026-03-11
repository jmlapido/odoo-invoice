import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ToastContainer, toast } from '../components/Toast'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

function BankModal({ bank, onSave, onClose }) {
  const [form, setForm] = useState(bank || { beneficiary_name: '', bank_name: '', branch: '', account_no: '', iban: '', swift: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.beneficiary_name.trim()) { toast.error('Beneficiary name is required'); return }
    setSaving(true)
    let error
    if (bank?.id) {
      ({ error } = await supabase.from('bank_details').update(form).eq('id', bank.id))
    } else {
      ({ error } = await supabase.from('bank_details').insert([form]))
    }
    setSaving(false)
    if (error) { toast.error('Failed to save bank details'); return }
    toast.success(bank?.id ? 'Updated' : 'Bank details added')
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-title">{bank?.id ? 'Edit Bank Details' : 'New Bank Details'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Beneficiary Name *</label>
            <input className="form-input" value={form.beneficiary_name} onChange={e => set('beneficiary_name', e.target.value)} placeholder="e.g. Silentnight UAE LLC." />
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input className="form-input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. Habib Bank AG Zurich" />
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input className="form-input" value={form.branch} onChange={e => set('branch', e.target.value)} placeholder="e.g. Jebel Ali Branch" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Account No.</label>
            <input className="form-input" value={form.account_no} onChange={e => set('account_no', e.target.value)} placeholder="e.g. 02-01-09-020311-105-01151-04" />
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input className="form-input" value={form.iban} onChange={e => set('iban', e.target.value)} placeholder="e.g. AE380290920311105115014" />
            </div>
            <div className="form-group">
              <label className="form-label">SWIFT</label>
              <input className="form-input" value={form.swift} onChange={e => set('swift', e.target.value)} placeholder="Optional" />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}><X size={14} /> Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
            {bank?.id ? 'Update' : 'Add Bank Details'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BankDetailsPage() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('bank_details').select('*').order('beneficiary_name')
    setBanks(data || [])
    setLoading(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    const { error } = await supabase.from('bank_details').delete().eq('id', id)
    if (error) { toast.error('Cannot delete — may be in use'); return }
    toast.success('Bank details deleted')
    load()
  }

  return (
    <>
      <ToastContainer />
      {modal !== null && (
        <BankModal bank={modal === 'new' ? null : modal} onSave={() => { setModal(null); load() }} onClose={() => setModal(null)} />
      )}

      <div className="page-header">
        <div>
          <div className="page-title">Bank Details</div>
          <div className="page-subtitle">Payment accounts for invoices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <Plus size={15} /> Add Bank
        </button>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner" /></div>
          ) : banks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏦</div>
              <h3>No bank details yet</h3>
              <p>Add bank details to use on invoice PDFs</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('new')}><Plus size={14} /> Add Bank</button>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>Bank</th>
                    <th>IBAN</th>
                    <th>A/C No.</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.beneficiary_name}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{[b.bank_name, b.branch].filter(Boolean).join(' — ')}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{b.iban || '—'}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{b.account_no || '—'}</td>
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(b)}><Pencil size={14} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon text-danger" onClick={() => handleDelete(b.id, b.beneficiary_name)}><Trash2 size={14} /></button>
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
