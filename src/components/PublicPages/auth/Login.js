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

  // Verification modal state
  const [verifyModal, setVerifyModal] = useState(null)
  // verifyModal shape: { purpose: 'email'|'2fa', userId, tempToken, email }

  const { login, completeAuth, resendVerification } = useAuth()
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
        const data = await login(email, password)

        if (data.requiresEmailVerification) {
          setVerifyModal({
            purpose: 'email',
            userId: data.user?.id,
            email: data.user?.email || email,
          })
          return
        }

        if (data.requiresTwoFactor) {
          setVerifyModal({
            purpose: '2fa',
            tempToken: data.tempToken,
            email: data.user?.email || email,
          })
          return
        }

        navigate('/user/dashboard')
      } catch (err) {
        setServerError(err.message || 'Failed to sign in. Check your credentials.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleVerifySuccess = (data) => {
    completeAuth(data)
    setVerifyModal(null)
    navigate('/user/dashboard')
  }

  const handleResendCode = async () => {
    if (!verifyModal) return
    if (verifyModal.purpose === 'email' && verifyModal.userId) {
      await resendVerification(verifyModal.userId, 'EmailVerification')
    }
    // For 2FA resend, we need to re-trigger login — not supported without re-auth
    // so just inform the user no resend is possible for 2FA in this flow
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
    verifyModal,
    setVerifyModal,
    handleVerifySuccess,
    handleResendCode,
  }
}
