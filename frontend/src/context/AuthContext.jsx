import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('ecoloop_user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
    } else {
      // Clear any stale data
      localStorage.removeItem('ecoloop_user')
      localStorage.removeItem('token')
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('ecoloop_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ecoloop_user')
    localStorage.removeItem('token')
  }

  const signup = (userData) => {
    setUser(userData)
    localStorage.setItem('ecoloop_user', JSON.stringify(userData))
  }

  const getToken = () => {
    return localStorage.getItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
