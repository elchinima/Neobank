import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/context/AuthContext'

export function useLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const next = validate()
    setErrors(next)

    if (Object.keys(next).length === 0) {
      setIsSubmitting(true)
      try {
        await login(email, password)
        navigate('/user/dashboard')
      } catch (err) {
        setServerError(err.message || 'Failed to sign in. Check your credentials.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    errors,
    setErrors,
    isSubmitting,
    serverError,
    validate,
    handleSubmit,
  }
}
