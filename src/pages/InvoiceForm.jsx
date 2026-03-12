import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useBlocker } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcLine, calcTotals, todayISO, formatAED } from '../lib/utils'
import { ToastContainer, toast } from '../components/Toast'
import { Plus, Trash2, Save, Eye, ChevronDown, AlertTriangle, X } from 'lucide-react'

const calculateDueDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 30)
  return d.toISOString().split('T')[0]
}

const EMPTY_LINE = () => ({
  _id: Math.random().toString(36).slice(2),
  description: '',
  quantity: 1,
  unit: 'Unit',
  unit_price: 0,
  discount_amount: 0,
  vat_percentage: 5,
  vat_amount: 0,
  amount: 0,
  sort_order: 0,
})

export default function InvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [banks, setBanks] = useState([])
  const [shippingAddresses, setShippingAddresses] = useState([])
  const [saving, setSaving] = useState(false)
  const [dupError, setDupError] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  const [initialForm, setInitialForm] = useState(null)
  const [initialLines, setInitialLines] = useState(null)
  const isSavingRef = useRef(false)
  const [saveAction, setSaveAction] = useState(null)

  const [form, setForm] = useState({
    invoice_number: '',
    invoice_date: todayISO(),
    due_date: calculateDueDate(todayISO()),
    source: '',
    po_reference: '',
    beneficiary_text: '',
    customer_id: '',
    bank_detail_id: '',
    shipping_address_id: '',
  })
  const [lines, setLines] = useState([EMPTY_LINE()])

  useEffect(() => {
    supabase.from('customers').select('*').order('name').then(({ data }) => setCustomers(data || []))
    supabase.from('bank_details').select('*').order('beneficiary_name').then(({ data }) => setBanks(data || []))
    supabase.from('shipping_addresses').select('*').order('name').then(({ data }) => setShippingAddresses(data || []))
    if (isEdit) loadInvoice()
    else {
      const defaultForm = {
        invoice_number: '',
        invoice_date: todayISO(),
        due_date: calculateDueDate(todayISO()),
        source: '',
        po_reference: '',
        beneficiary_text: '',
        customer_id: '',
        bank_detail_id: '',
        shipping_address_id: '',
      }
      const defaultLines = [EMPTY_LINE()]
      setInitialForm(JSON.parse(JSON.stringify(defaultForm)))
      setInitialLines(JSON.parse(JSON.stringify(defaultLines)))
    }
  }, [id])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isSavingRef.current) return
      const changes = getChanges()
      if (changes.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [form, lines, initialForm, initialLines])

  const getChanges = () => {
    if (!initialForm || !initialLines) return []
    const changes = []

    const fieldLabels = {
      invoice_number: 'Invoice Number',
      invoice_date: 'Invoice Date',
      due_date: 'Due Date',
      source: 'Source',
      po_reference: 'PO Reference',
      beneficiary_text: 'Beneficiary',
      customer_id: 'Customer',
      bank_detail_id: 'Bank Details',
      shipping_address_id: 'Shipping Address'
    }

    Object.keys(fieldLabels).forEach(key => {
      let v1 = String(initialForm[key] || '').trim()
      let v2 = String(form[key] || '').trim()
      
      if (v1 !== v2) {
        let label = fieldLabels[key]
        if (key === 'customer_id') {
          const c1 = customers.find(c => String(c.id) === v1)?.name || 'None'
          const c2 = customers.find(c => String(c.id) === v2)?.name || 'None'
          if (c1 !== c2) changes.push(`Customer changed from "${c1}" to "${c2}"`)
        } else if (key === 'bank_detail_id') {
          const b1 = banks.find(b => String(b.id) === v1)?.beneficiary_name || 'None'
          const b2 = banks.find(b => String(b.id) === v2)?.beneficiary_name || 'None'
          if (b1 !== b2) changes.push(`Bank Details changed from "${b1}" to "${b2}"`)
        } else if (key === 'shipping_address_id') {
          const s1 = shippingAddresses.find(s => String(s.id) === v1)?.name || 'None'
          const s2 = shippingAddresses.find(s => String(s.id) === v2)?.name || 'None'
          if (s1 !== s2) changes.push(`Shipping Address changed from "${s1}" to "${s2}"`)
        } else {
          changes.push(`${label} changed from "${v1}" to "${v2}"`)
        }
      }
    })

    // Compare lines
    if (lines.length !== initialLines.length) {
      changes.push(`Line items count changed from ${initialLines.length} to ${lines.length}`)
    } else {
      lines.forEach((line, i) => {
        const init = initialLines[i]
        if (!init) return
        const diffs = []
        if (String(line.description || '').trim() !== String(init.description || '').trim()) diffs.push('description')
        if (Number(line.quantity || 0) !== Number(init.quantity || 0)) diffs.push('qty')
        if (String(line.unit || '').trim() !== String(init.unit || '').trim()) diffs.push('unit')
        if (Number(line.unit_price || 0) !== Number(init.unit_price || 0)) diffs.push('price')
        if (Number(line.discount_amount || 0) !== Number(init.discount_amount || 0)) diffs.push('discount')

        if (diffs.length > 0) {
          changes.push(`Line ${i + 1} modified: ${diffs.join(', ')}`)
        }
      })
    }

    return changes
  }

  const blocker = useBlocker(({ currentValue, nextLocation }) => {
    return !isSavingRef.current && initialForm && initialLines && getChanges().length > 0
  })

  const loadInvoice = async () => {
    setLoading(true)
    const { data: inv } = await supabase.from('invoices').select('*').eq('id', id).single()
    const { data: invLines } = await supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('sort_order')
    if (inv) {
      const loadedForm = {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date || calculateDueDate(inv.invoice_date),
        source: inv.source || '',
        po_reference: inv.po_reference || '',
        beneficiary_text: inv.beneficiary_text || '',
        customer_id: inv.customer_id || '',
        bank_detail_id: inv.bank_detail_id || '',
        shipping_address_id: inv.shipping_address_id || '',
      }
      setForm(loadedForm)
      setLines((invLines || []).map(l => ({ ...l, _id: Math.random().toString(36).slice(2) })))

      setInitialForm(JSON.parse(JSON.stringify(loadedForm)))
      setInitialLines((invLines || []).map(l => ({ ...JSON.parse(JSON.stringify(l)), _id: null })))
    }
    setLoading(false)
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const checkDuplicate = async (num) => {
    if (!num) return
    const { data } = await supabase.from('invoices').select('id').eq('invoice_number', num)
    const dup = data?.some(d => d.id !== id)
    setDupError(dup)
  }

  const updateLine = (idx, key, val) => {
    setLines(prev => {
      const updated = [...prev]
      updated[idx] = calcLine({ ...updated[idx], [key]: val })
      return updated
    })
  }

  const addLine = () => setLines(prev => [...prev, EMPTY_LINE()])
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx))

  const totals = calcTotals(lines)

  const handleSaveClick = (andPreview = false) => {
    if (!form.invoice_number.trim()) { toast.error('Invoice number is required'); return }
    if (!form.invoice_date) { toast.error('Invoice date is required'); return }
    if (!form.customer_id) { toast.error('Please select a customer'); return }
    if (dupError) { toast.error('Invoice number already exists'); return }

    const changes = getChanges()
    if (changes.length > 0) {
      setSaveAction({ andPreview })
    } else {
      executeSave(andPreview)
    }
  }

  const executeSave = async (andPreview = false, customNavPath = null) => {
    setSaving(true)
    isSavingRef.current = true

    const invoicePayload = {
      ...form,
      ...totals,
      customer_id: form.customer_id || null,
      bank_detail_id: form.bank_detail_id || null,
      shipping_address_id: form.shipping_address_id || null,
      updated_at: new Date().toISOString(),
    }

    let invoiceId = id
    if (isEdit) {
      const { error } = await supabase.from('invoices').update(invoicePayload).eq('id', id)
      if (error) {
        if (error.code === '23505') toast.error('Invoice number already exists')
        else toast.error('Failed to save invoice: ' + error.message)
        setSaving(false); return
      }
      // delete existing lines then re-insert
      await supabase.from('invoice_lines').delete().eq('invoice_id', id)
    } else {
      const { data, error } = await supabase.from('invoices').insert([invoicePayload]).select().single()
      if (error) {
        if (error.code === '23505') toast.error('Invoice number already exists')
        else toast.error('Failed to save invoice: ' + error.message)
        setSaving(false); return
      }
      invoiceId = data.id
    }

    // save lines
    const linePayload = lines.map((l, i) => ({
      invoice_id: invoiceId,
      description: l.description,
      quantity: Number(l.quantity),
      unit: l.unit,
      unit_price: Number(l.unit_price),
      discount_amount: Number(l.discount_amount),
      vat_percentage: Number(l.vat_percentage),
      vat_amount: Number(l.vat_amount),
      amount: Number(l.amount),
      sort_order: i,
    }))

    const { error: lineError } = await supabase.from('invoice_lines').insert(linePayload)
    if (lineError) { toast.error('Lines saved with errors: ' + lineError.message) }

    setSaving(false)
    toast.success(`Invoice ${form.invoice_number} saved!`)

    // Update initial state so blocker doesn't trigger
    setInitialForm(JSON.parse(JSON.stringify(form)))
    setInitialLines(lines.map(l => ({ ...JSON.parse(JSON.stringify(l)), _id: null })))

    if (customNavPath) navigate(customNavPath)
    else if (andPreview) navigate(`/invoice/${invoiceId}/preview`)
    else navigate('/dashboard')

    setTimeout(() => { isSavingRef.current = false }, 100)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <>
      <ToastContainer />

      {(blocker.state === 'blocked' || saveAction) && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 550 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: 'var(--warning)' }}>
              <AlertTriangle size={24} />
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Unsaved Changes</div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>

            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                Summary of changes:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {getChanges().length > 0 ? (
                  getChanges().map((change, i) => (
                    <li key={i}>{change}</li>
                  ))
                ) : (
                  <li>Modified invoice details</li>
                )}
              </ul>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
              <button className="btn btn-ghost" onClick={() => {
                if (blocker.state === 'blocked') blocker.reset();
                else setSaveAction(null);
              }}>
                Cancel
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" onClick={() => {
                  if (blocker.state === 'blocked') blocker.proceed();
                  else {
                    // Discard changes and stay
                    setForm(initialForm);
                    setLines(initialLines);
                    setSaveAction(null);
                  }
                }}>
                  Discard Changes
                </button>
                <button className="btn btn-primary" onClick={() => {
                  if (blocker.state === 'blocked') {
                    const dest = blocker.location?.pathname;
                    blocker.reset();
                    executeSave(false, dest);
                  } else {
                    const preview = saveAction.andPreview;
                    setSaveAction(null);
                    executeSave(preview);
                  }
                }}>
                  <Save size={14} /> Save Changes and Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="page-header">
        <div>
          <div className="page-title">{isEdit ? `Edit ${form.invoice_number}` : 'New Invoice'}</div>
          <div className="page-subtitle">TAX Invoice</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => handleSaveClick(false)} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button className="btn btn-primary" onClick={() => handleSaveClick(true)} disabled={saving}>
            <Eye size={14} /> Save & Preview
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Invoice Meta */}
        <div className="card mb-4">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: 'var(--text)' }}>Invoice Details</div>

          <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Invoice Number *</label>
              <input
                className={`form-input${dupError ? ' error' : ''}`}
                value={form.invoice_number}
                onChange={e => { setField('invoice_number', e.target.value); setDupError(false) }}
                onBlur={e => checkDuplicate(e.target.value)}
                placeholder="e.g. INV/2026/01213"
              />
              {dupError && <div className="input-error">⚠️ This invoice number already exists</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-select" value={form.customer_id} onChange={e => setField('customer_id', e.target.value)}>
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Invoice Date *</label>
              <input className="form-input" type="date" value={form.invoice_date} onChange={e => {
                const newDate = e.target.value;
                setForm(f => ({ ...f, invoice_date: newDate, due_date: calculateDueDate(newDate) }));
              }} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.due_date} onChange={e => setField('due_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <input className="form-input" value={form.source} onChange={e => setField('source', e.target.value)} placeholder="e.g. S130878" />
            </div>
          </div>

          <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">PO Reference</label>
              <input className="form-input" value={form.po_reference} onChange={e => setField('po_reference', e.target.value)} placeholder="e.g. 405-2544113-6735515" />
            </div>
            <div className="form-group">
              <label className="form-label">Beneficiary</label>
              <input className="form-input" value={form.beneficiary_text} onChange={e => setField('beneficiary_text', e.target.value)} placeholder="e.g. Amna Moyelh Altijarih, Ash Sharekah" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Shipping Address</label>
            <select className="form-select" value={form.shipping_address_id} onChange={e => setField('shipping_address_id', e.target.value)}>
              <option value="">— Select Shipping Address (Optional) —</option>
              {shippingAddresses.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {a.address_line1}, {a.city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="card mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Line Items</div>
            <button className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={13} /> Add Line</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="line-items-table">
              <thead>
                <tr>
                  <th style={{ width: '30%', minWidth: 180 }}>Description</th>
                  <th style={{ width: 80 }}>Qty</th>
                  <th style={{ width: 80 }}>Unit</th>
                  <th style={{ width: 100 }}>Unit Price</th>
                  <th style={{ width: 100 }}>Disc %</th>
                  <th style={{ width: 60 }}>VAT %</th>
                  <th style={{ width: 110 }}>VAT Amount</th>
                  <th style={{ width: 110 }}>Amount</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line._id}>
                    <td><input className="form-input" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} placeholder="Product or service" /></td>
                    <td><input className="form-input" type="number" min="0" step="0.001" value={line.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)} /></td>
                    <td>
                      <select className="form-select" value={line.unit} onChange={e => updateLine(idx, 'unit', e.target.value)}>
                        <option>Unit</option>
                        <option>Pcs</option>
                        <option>Set</option>
                        <option>Box</option>
                        <option>Kg</option>
                        <option>m²</option>
                      </select>
                    </td>
                    <td><input className="form-input" type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(idx, 'unit_price', e.target.value)} /></td>
                    <td><input className="form-input" type="number" min="0" step="0.01" value={line.discount_amount} onChange={e => updateLine(idx, 'discount_amount', e.target.value)} /></td>
                    <td><input className="form-input" type="number" min="0" value={5} readOnly style={{ opacity: 0.7 }} /></td>
                    <td><input className="form-input" value={Number(line.vat_amount).toFixed(2)} readOnly style={{ opacity: 0.7 }} /></td>
                    <td><input className="form-input" value={Number(line.amount).toFixed(2)} readOnly style={{ opacity: 0.7, fontWeight: 600 }} /></td>
                    <td>
                      <button className="btn btn-ghost btn-icon text-danger" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ marginTop: 24 }}>
            <div className="totals-box">
              <div className="totals-row">
                <span>Discount</span>
                <span>{formatAED(totals.discount_total)}</span>
              </div>
              <div className="totals-row">
                <span>Untaxed Amount</span>
                <span>{formatAED(totals.untaxed_amount)}</span>
              </div>
              <div className="totals-row">
                <span>VAT 5%</span>
                <span>{formatAED(totals.vat_amount)}</span>
              </div>
              <div className="totals-row total">
                <span>Total</span>
                <span>{formatAED(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Payment / Bank Details</div>
          <div className="form-group">
            <label className="form-label">Select Bank Account</label>
            <select className="form-select" value={form.bank_detail_id} onChange={e => setField('bank_detail_id', e.target.value)}>
              <option value="">— Select Bank Details —</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.beneficiary_name} — {b.bank_name}</option>)}
            </select>
            {!form.bank_detail_id && <div className="input-hint">No bank details selected — PDF will skip bank section</div>}
          </div>
        </div>
      </div>
    </>
  )
}
