import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('neobank_token'))
  const [loading, setLoading] = useState(true)

  const refreshTokenFunc = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('neobank_refresh_token')
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = await response.json()
      localStorage.setItem('neobank_token', data.token)
      if (data.refreshToken) {
        localStorage.setItem('neobank_refresh_token', data.refreshToken)
      }
      setToken(data.token)
      setUser(data.user)
      return data.token
    } catch (err) {
      localStorage.removeItem('neobank_token')
      localStorage.removeItem('neobank_refresh_token')
      setToken(null)
      setUser(null)
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('neobank_refresh_token')
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      })
    } catch (err) {
      console.warn('Logout request error:', err)
    } finally {
      localStorage.removeItem('neobank_token')
      localStorage.removeItem('neobank_refresh_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  const fetchWithAuth = useCallback(
    async (url, options = {}) => {
      let currentToken = token || localStorage.getItem('neobank_token')

      const headers = {
        ...options.headers,
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      }

      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })

      if (response.status === 401) {
        const newToken = await refreshTokenFunc()
        if (newToken) {
          const retryHeaders = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          }
          response = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          })
        }
      }

      return response
    },
    [token, refreshTokenFunc]
  )

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('neobank_token')
      if (!storedToken) {
        const refreshedToken = await refreshTokenFunc()
        if (!refreshedToken) {
          setLoading(false)
          return
        }
      }

      try {
        const currentToken = localStorage.getItem('neobank_token')
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
          credentials: 'include',
        })

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setToken(currentToken)
        } else if (response.status === 401) {
          const newToken = await refreshTokenFunc()
          if (newToken) {
            const retryRes = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
              credentials: 'include',
            })
            if (retryRes.ok) {
              const userData = await retryRes.json()
              setUser(userData)
              setToken(newToken)
            }
          }
        }
      } catch (err) {
        console.error('Failed to verify token', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [refreshTokenFunc])

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    localStorage.setItem('neobank_token', data.token)
    if (data.refreshToken) {
      localStorage.setItem('neobank_refresh_token', data.refreshToken)
    }
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const register = async ({ email, password, firstName, lastName }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, firstName, lastName }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed')
    }

    localStorage.setItem('neobank_token', data.token)
    if (data.refreshToken) {
      localStorage.setItem('neobank_refresh_token', data.refreshToken)
    }
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const updateUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null))
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchWithAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
