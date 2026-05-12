import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken && !token) {
      setToken(storedToken)
    }
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        setLoading(true)
        try {
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (err) {
          console.error('Auth fetch failed:', err)
          if (err.response?.status === 401) {
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        } finally {
          setLoading(false)
        }
      } else if (!token) {
        setUser(null)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    fetchUser()
  }, [token])

  const login = async (username, password) => {
    const response = await authService.login(username, password)
    // Set token first in localStorage, then state
    const newToken = response.access_token
    if (newToken) {
      localStorage.setItem('token', newToken)
      // Update state - this will trigger useEffect to fetch user
      setToken(newToken)
      // Also set user directly from response to avoid extra API call
      setUser(response.user)
      setLoading(false)
    }
    return response
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
