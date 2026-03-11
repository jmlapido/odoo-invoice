import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function PasswordGate() {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (login(password)) {
        navigate('/dashboard')
      } else {
        setError('Incorrect password. Please try again.')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div className="gate-bg">
      <div className="gate-card">
        <div className="gate-logo">
          <div className="gate-logo-icon">🌙</div>
          <div className="gate-title">Invoice Generator</div>
          <div className="gate-sub">Silentnight UAE LLC — Staff Access</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className={`form-input${error ? ' error' : ''}`}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter access password"
                autoFocus
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: '6px' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <div className="input-error" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} /> {error}
            </div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || !password}
            style={{ justifyContent: 'center', height: 42 }}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Access System'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>
          This is system generated document and does not require signature.
        </div>
      </div>
    </div>
  )
}
