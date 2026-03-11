import { useState, useEffect } from 'react'

let _addToast = null

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    _addToast = (msg, type = 'success') => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, msg, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { _addToast = null }
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}

export const toast = {
  success: (msg) => _addToast?.(msg, 'success'),
  error: (msg) => _addToast?.(msg, 'error'),
}
