import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useRegister() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validate = () => {
    const next = {}
    if (!firstName.trim()) next.firstName = 'First name is required'
    if (!lastName.trim()) next.lastName = 'Last name is required'
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters'
    if (!confirm) next.confirm = 'Please confirm your password'
    else if (confirm !== password) next.confirm = 'Passwords do not match'
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length === 0) {
      console.log('Register submitted', { firstName, lastName, email, password })
      navigate('/dashboard')
    }
  }

  return {
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    errors,
    setErrors,
    validate,
    handleSubmit,
  }
}

