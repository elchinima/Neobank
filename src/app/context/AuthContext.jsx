import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => Cookies.get('neobank_token'))
  const [loading, setLoading] = useState(true)

  const refreshTokenFunc = useCallback(async () => {
    try {
      const storedRefreshToken = Cookies.get('neobank_refresh_token')
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
      Cookies.set('neobank_token', data.token, { expires: 7 })
      if (data.refreshToken) {
        Cookies.set('neobank_refresh_token', data.refreshToken, { expires: 7 })
      }
      setToken(data.token)
      setUser(data.user)
      return data.token
    } catch (err) {
      Cookies.remove('neobank_token')
      Cookies.remove('neobank_refresh_token')
      setToken(null)
      setUser(null)
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const storedRefreshToken = Cookies.get('neobank_refresh_token')
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
      Cookies.remove('neobank_token')
      Cookies.remove('neobank_refresh_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  const fetchWithAuth = useCallback(
    async (url, options = {}) => {
      let currentToken = token || Cookies.get('neobank_token')

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
      const storedToken = Cookies.get('neobank_token')
      if (!storedToken) {
        const refreshedToken = await refreshTokenFunc()
        if (!refreshedToken) {
          setLoading(false)
          return
        }
      }

      try {
        const currentToken = Cookies.get('neobank_token')
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

  // ─── Login ────────────────────────────────────────────────────────────────
  // Returns: { requiresEmailVerification, requiresTwoFactor, tempToken, user }
  // Or full auth data if no verification needed
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

    // If verification/2FA required, return raw data for caller to handle
    if (data.requiresEmailVerification || data.requiresTwoFactor) {
      return data
    }

    // Full login completed
    Cookies.set('neobank_token', data.token, { expires: 7 })
    if (data.refreshToken) {
      Cookies.set('neobank_refresh_token', data.refreshToken, { expires: 7 })
    }
    setToken(data.token)
    setUser(data.user)
    return data
  }

  const loginWithGoogle = async (googleToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ token: googleToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Google Login failed')
    }

    if (data.requiresTwoFactor) {
      return data
    }

    Cookies.set('neobank_token', data.token, { expires: 7 })
    if (data.refreshToken) {
      Cookies.set('neobank_refresh_token', data.refreshToken, { expires: 7 })
    }
    setToken(data.token)
    setUser(data.user)
    return data
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  // After register, email verification is always required
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

    // Registration always requires email verification — return data for caller
    return data
  }

  // ─── Complete Auth (called after successful verification) ─────────────────
  const completeAuth = (data) => {
    if (data.token) {
      Cookies.set('neobank_token', data.token, { expires: 7 })
      if (data.refreshToken) {
        Cookies.set('neobank_refresh_token', data.refreshToken, { expires: 7 })
      }
      setToken(data.token)
      setUser(data.user)
    }
  }

  // ─── Resend Verification ──────────────────────────────────────────────────
  const resendVerification = async (userId, purpose = 'EmailVerification') => {
    const response = await fetch(`${API_BASE_URL}/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, purpose }),
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Failed to resend code')
    }
  }

  // ─── Toggle 2FA ───────────────────────────────────────────────────────────
  const toggleTwoFactor = async (enabled) => {
    const currentToken = token || Cookies.get('neobank_token')
    const response = await fetch(`${API_BASE_URL}/auth/toggle-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ enabled }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to toggle 2FA')
    }
    setUser((prev) => prev ? { ...prev, twoFactorEnabled: enabled } : null)
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
    loginWithGoogle,
    register,
    logout,
    updateUser,
    fetchWithAuth,
    completeAuth,
    resendVerification,
    toggleTwoFactor,
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
