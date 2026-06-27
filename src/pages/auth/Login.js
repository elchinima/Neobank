import { useState } from 'react'

export function useLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters'
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length === 0) {
      console.log('Login submitted', { email, password })
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
    validate,
    handleSubmit,
  }
}
