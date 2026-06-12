import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)   // 'user' | 'ngo'
  const [loading, setLoading] = useState(true)

  /* Restore session on mount */
  useEffect(() => {
    const stored = localStorage.getItem('hh_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    const storedRole = localStorage.getItem('hh_role')
    if (storedRole) setRole(storedRole)
    setLoading(false)
  }, [])

  const loginUser = async ({ email, password }) => {
    const { data } = await api.post('/auth/user/login', { email, password })
    const u = data.data?.user || data.user || data.data || data
    const token = data.data?.token || data.token
    if (token) localStorage.setItem('hh_token', token)
    localStorage.setItem('hh_user', JSON.stringify(u))
    localStorage.setItem('hh_role', 'user')
    setUser(u)
    setRole('user')
    return u
  }

  const loginNgo = async ({ email, password, registrationNumber }) => {
    const { data } = await api.post('/auth/ngo/login', {
      email, password, registrationNumber
    })
    const u = data.data?.ngo || data.ngo || data.data || data
    const token = data.data?.token || data.token
    if (token) localStorage.setItem('hh_token', token)
    localStorage.setItem('hh_user', JSON.stringify(u))
    localStorage.setItem('hh_role', 'ngo')
    setUser(u)
    setRole('ngo')
    return u
  }

  const loginAdmin = async ({ email, password }) => {
    const { data } = await api.post('/admin/login', { email, password })
    if (data.requiresOtp) {
      return data
    }
    const u = data.user || data
    const token = data.token
    if (token) localStorage.setItem('hh_token', token)
    localStorage.setItem('hh_user', JSON.stringify(u))
    localStorage.setItem('hh_role', 'admin')
    setUser(u)
    setRole('admin')
    return u
  }

  const verifyOtpAdmin = async (email, otp) => {
    const { data } = await api.post('/admin/verify-login-otp', { email, otp })
    const u = data.user || data
    const token = data.token
    if (token) localStorage.setItem('hh_token', token)
    localStorage.setItem('hh_user', JSON.stringify(u))
    localStorage.setItem('hh_role', 'admin')
    setUser(u)
    setRole('admin')
    return u
  }

  const registerAdmin = async (payload) => {
    const { data } = await api.post('/admin/register', payload)
    return data
  }

  const registerUser = async (payload) => {
    const { data } = await api.post('/auth/user/register', payload)
    return data
  }

  const registerNgo = async (payload) => {
    const { data } = await api.post('/auth/ngo/register', payload)
    return data
  }

  const verifyOtpUser = async (email, otp) => {
    const { data } = await api.post('/auth/user/verify-otp', { email, otp })
    return data
  }

  const verifyOtpNgo = async (email, otp) => {
    const { data } = await api.post('/auth/ngo/verify-otp', { email, otp })
    return data
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('hh_user')
    localStorage.removeItem('hh_role')
    localStorage.removeItem('hh_token')
    setUser(null)
    setRole(null)
  }

  const updateUser = (updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('hh_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{
      user, role, loading,
      loginUser, loginNgo, loginAdmin,
      registerUser, registerNgo, registerAdmin,
      verifyOtpUser, verifyOtpNgo, verifyOtpAdmin,
      logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
