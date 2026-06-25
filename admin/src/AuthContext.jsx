import { createContext, useContext, useState, useEffect } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const email = localStorage.getItem('email')
    if (token && email) {
      setUser({ token, email })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await api.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('email', data.user?.email || email)
    setUser({ token: data.token, email: data.user?.email || email })
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
