import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatAED, numberToWords } from '../lib/utils'
import { ToastContainer, toast } from '../components/Toast'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import html2pdf from 'html2pdf.js'

// Import the local logo
import logoImg from '../assets/logo.png'
// Import dedicated preview styles
import './InvoicePreview.css'

export default function InvoicePreview() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const pdfRef = useRef(null)

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    const { data: inv } = await supabase.from('invoices').select('*, customers(*), bank_details(*)').eq('id', id).single()
    const { data: lines } = await supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('sort_order')
    const { data: comp } = await supabase.from('company_settings').select('*').single()

    if (inv && comp) {
      setData({ invoice: inv, lines: lines || [], company: comp })
    } else {
      toast.error('Invoice or company settings not found')
    }
    setLoading(false)
  }

  const handleDownload = () => {
    if (!data || generating) return
    setGenerating(true)

    const element = pdfRef.current
    const opt = {
      margin: [15, 15, 12, 15],
      filename: `${data.invoice.invoice_number.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }

    html2pdf().set(opt).from(element).save().then(() => {
      setGenerating(false)
      toast.success('PDF Downloaded')
    })
  }

  if (loading) return (
    <div className="invoice-preview-page">
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  if (!data) return <div className="invoice-preview-page" style={{ color: '#333' }}>Failed to load preview</div>

  const { invoice: inv, lines, company: cmp } = data
  const cust = inv.customers || {}
  const bank = inv.bank_details

  return (
    <div className="invoice-preview-page">
      <ToastContainer />

      {/* Top action bar */}
      <div className="action-bar">
        <Link to="/dashboard" className="btn btn-secondary" style={{ background: '#fff', color: '#111' }}>
          <ArrowLeft size={14} /> Back
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ background: '#fff', color: '#111' }} onClick={() => window.print()}>
            <Printer size={14} /> Print
          </button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={generating}>
            {generating ? <span className="spinner" style={{ width: 14, height: 14, borderColor: '#fff', borderTopColor: 'transparent' }} /> : <Download size={14} />}
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* A4 PDF Preview Container */}
      <div className="invoice-container">
        <div ref={pdfRef} className="invoice-content">

          {/* Header Row */}
          <div className="invoice-header">
            {/* Logo */}
            <div className="invoice-logo">
              <img src={logoImg} alt="Silentnight" />
            </div>

            {/* Company Info Top Right */}
            <div className="company-info">
              <div className="company-name">{cmp.company_name}</div>
              <div className="info-row">VAT: <span>{cmp.vat_number}</span></div>
              <div className="info-row">Tel: <span>{cmp.phone}</span></div>
              <div className="info-row"><span>{cmp.email}</span></div>
              <div className="info-row"><span>{cmp.website}</span></div>
            </div>
          </div>

          {/* Receiver Address (Push to right) */}
          <div className="receiver-address">
            <div className="receiver-details">
              <div className="detail-row">{cust.name}</div>
              {cust.street && <div className="detail-row">{cust.street}</div>}
              {cust.city && <div className="detail-row">{cust.city}</div>}
              {cust.country && <div className="detail-row">{cust.country}</div>}
              {cust.vat_number && <div className="detail-row">VAT: {cust.vat_number}</div>}
            </div>
          </div>

          {/* TAX Invoice Title */}
          <div className="invoice-title">
            TAX Invoice {inv.invoice_number}
          </div>

          {/* Meta Data Row */}
          <div className="meta-row">
            <div className="meta-col">
              <div className="meta-label">Invoice Date:</div>
              <div className="meta-val">{formatDate(inv.invoice_date)}</div>
            </div>
            <div className="meta-col due-date">
              <div className="meta-label">Due Date:</div>
              <div className="meta-val">{formatDate(inv.due_date) || '-'}</div>
            </div>
            <div className="meta-col">
              <div className="meta-label">Source:</div>
              <div className="meta-val">{inv.source || '-'}</div>
            </div>
            <div className="meta-col po-ref">
              <div className="meta-label">PO Reference:</div>
              <div className="meta-val">{inv.po_reference || '-'}</div>
            </div>
            <div className="meta-col beneficiary">
              <div className="meta-label">Beneficiary:</div>
              <div className="meta-val">
                {inv.beneficiary_text ? inv.beneficiary_text.split(',').map((line, i) => (
                  <div key={i}>{line.trim()}</div>
                )) : '-'}
              </div>
            </div>
          </div>

          <div className="thick-divider"></div>

          {/* Line Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th></th>
                <th></th>
                <th className="text-center">Unit</th>
                <th className="text-center">Disc %</th>
                <th colSpan="2" className="text-center">VAT</th>
                <th></th>
              </tr>
              <tr>
                <th className="text-left">Description</th>
                <th className="text-center w-80">Quantity</th>
                <th className="text-center w-70">Price</th>
                <th className="text-center w-70">Amount</th>
                <th className="text-center w-40"></th>
                <th className="text-center w-70">Amount</th>
                <th className="text-center w-80">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td className="text-center">
                    <div>{Number(line.quantity).toFixed(2)}</div>
                    <div>{line.unit}</div>
                  </td>
                  <td className="text-center">
                    {Number(line.unit_price).toFixed(2)}
                  </td>
                  <td className="text-center">
                    {Number(line.discount_amount).toFixed(0)}%
                  </td>
                  <td className="text-center">
                    {Number(line.vat_percentage).toFixed(0)}%
                  </td>
                  <td className="text-center">
                    {Number(line.vat_amount).toFixed(2)} <span className="val-faint">AED</span>
                  </td>
                  <td className="text-center">
                    {Number(line.amount).toFixed(2)} <span className="val-faint">AED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="thick-divider"></div>

          {/* Totals Section */}
          <div className="totals-container">
            <div className="totals-box">
              <div className="totals-row">
                <span className="totals-label">Discount</span>
                <span>{Number(inv.discount_total).toFixed(2)} AED</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">Untaxed Amount</span>
                <span>{Number(inv.untaxed_amount).toFixed(2)} AED</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">VAT 5%</span>
                <span>{Number(inv.vat_amount).toFixed(2)} AED</span>
              </div>
              <div className="totals-row">
                <span className="totals-label">Total</span>
                <span>{Number(inv.total).toFixed(2)} AED</span>
              </div>
              <div className="thick-divider"></div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="amount-words">
            {numberToWords(inv.total)}
          </div>
          <div className="payment-comm">
            Please use the following communication for your payment : <strong>{inv.invoice_number}</strong>
          </div>

          {/* Bank Details */}
          {bank && (
            <div className="bank-section">
              <div className="bank-label">
                Bank details for payment purposes:
              </div>
              <table className="bank-table">
                <thead>
                  <tr>
                    <th>Beneficiary</th>
                    <th>Bank name</th>
                    <th>Branch</th>
                    <th>A/C No.</th>
                    <th>IBAN No.</th>
                    <th>Swift</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{bank.beneficiary_name}</td>
                    <td>{bank.bank_name}</td>
                    <td>{bank.branch}</td>
                    <td>{bank.account_no}</td>
                    <td>{bank.iban}</td>
                    <td>{bank.swift}</td>
                  </tr>
                </tbody>
              </table>
              <div className="bank-footer-text">
                <div className="title">Bank Details</div>
                <div>SilentNight</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="invoice-footer">
            <div className="footer-col-1">
              <div>{cmp.phone}</div>
              <div>{cmp.email}</div>
              <div>{cmp.website}</div>
              <div>{cmp.vat_number}</div>
            </div>

            <div className="footer-col-2">
              <div>{cmp.company_name}</div>
              <div>{cmp.address_line1}</div>
              <div>{cmp.address_line2}</div>
              <div>{cmp.city}</div>
              <div>{cmp.country}</div>
            </div>

            <div className="footer-col-3">
              <div className="footer-tagline">
                {cmp.tagline?.split(' ').reduce((acc, word, idx) => {
                  if (idx === 0) return word
                  return idx % 4 === 0 ? acc + '\n' + word : acc + ' ' + word
                }, '').split('\n').map((l, i) => <div key={i}>{l}</div>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="page-number">1</div>
              </div>
            </div>
          </div>

          {/* Disclaimer at Bottom */}
          <div className="disclaimer">
            <u>This is system generated document and does not require signature.</u>
          </div>

        </div>
      </div>
    </div>
  )
}
