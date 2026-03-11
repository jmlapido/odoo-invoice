import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const PASSWORD = import.meta.env.VITE_APP_PASSWORD

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('invoice_auth')
    if (stored === 'true') setAuthed(true)
  }, [])

  const login = (password) => {
    if (password === PASSWORD) {
      sessionStorage.setItem('invoice_auth', 'true')
      setAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem('invoice_auth')
    setAuthed(false)
  }

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
