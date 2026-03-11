/**
 * Convert a number to words (AED invoice style)
 * e.g. 398.00 → "Three Hundred And Ninety-Eight Dirham"
 */
export function numberToWords(amount) {
  if (isNaN(amount) || amount === null) return ''
  const num = Math.round(Number(amount) * 100) / 100
  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertHundreds(n) {
    if (n === 0) return ''
    if (n < 20) return ones[n]
    if (n < 100) {
      const t = Math.floor(n / 10)
      const o = n % 10
      return tens[t] + (o ? '-' + ones[o] : '')
    }
    const h = Math.floor(n / 100)
    const rest = n % 100
    return ones[h] + ' Hundred' + (rest ? ' And ' + convertHundreds(rest) : '')
  }

  function convertThousands(n) {
    if (n === 0) return 'Zero'
    let result = ''
    if (n >= 1000000) {
      result += convertHundreds(Math.floor(n / 1000000)) + ' Million '
      n = n % 1000000
    }
    if (n >= 1000) {
      result += convertHundreds(Math.floor(n / 1000)) + ' Thousand '
      n = n % 1000
    }
    if (n > 0) {
      result += convertHundreds(n)
    }
    return result.trim()
  }

  const intWords = intPart === 0 ? 'Zero' : convertThousands(intPart)
  let result = intWords + ' Dirham'
  if (decPart > 0) {
    result += ' And ' + convertThousands(decPart) + ' Fils'
  }
  return result
}

/**
 * Format a number as AED currency string
 */
export function formatAED(amount) {
  const num = Number(amount) || 0
  return num.toFixed(2) + ' AED'
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Today's date as YYYY-MM-DD
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calculate line item totals
 */
export function calcLine(line) {
  const qty = Number(line.quantity) || 0
  const price = Number(line.unit_price) || 0
  const discPct = Number(line.discount_amount) || 0
  const vatPct = Number(line.vat_percentage) || 5
  
  const gross = qty * price
  const discAmt = (gross * discPct) / 100
  const subtotal = gross - discAmt
  const vatAmt = (subtotal * vatPct) / 100
  const amount = subtotal + vatAmt
  
  return {
    ...line,
    vat_amount: Math.round(vatAmt * 100) / 100,
    amount: Math.round(amount * 100) / 100,
  }
}

/**
 * Calculate invoice totals from lines array
 */
export function calcTotals(lines) {
  let discountTotal = 0
  let untaxedAmount = 0
  let vatAmount = 0
  let total = 0

  lines.forEach(l => {
    const qty = Number(l.quantity) || 0
    const price = Number(l.unit_price) || 0
    const discPct = Number(l.discount_amount) || 0
    const vatPct = Number(l.vat_percentage) || 5
    
    const gross = qty * price
    const discAmt = (gross * discPct) / 100
    const subtotal = gross - discAmt
    const vat = (subtotal * vatPct) / 100

    discountTotal += discAmt
    untaxedAmount += subtotal
    vatAmount += vat
    total += subtotal + vat
  })

  return {
    discount_total: Math.round(discountTotal * 100) / 100,
    untaxed_amount: Math.round(untaxedAmount * 100) / 100,
    vat_amount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}
