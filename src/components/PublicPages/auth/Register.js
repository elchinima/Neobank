import { useState } from 'react'
import { useAuth } from '../../../app/context/AuthContext'

export function useRegister() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Verification modal state
  const [verifyModal, setVerifyModal] = useState(null)
  // verifyModal shape: { purpose: 'email', userId, email }

  // Terms Consent modal state
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [clickPos, setClickPos] = useState(null)

  const { register, completeAuth, resendVerification } = useAuth()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const next = validate()
    setErrors(next)

    if (Object.keys(next).length === 0) {
      if (e && e.clientX && e.clientY) {
        setClickPos({ x: e.clientX, y: e.clientY })
      } else {
        setClickPos(null)
      }
      setPendingAction({ type: 'credentials', firstName, lastName, email, password })
      setTermsModalOpen(true)
    }
  }

  const executeRegister = async (action) => {
    setIsSubmitting(true)
    setServerError('')
    try {
      let data;
      if (action.type === 'credentials') {
        data = await register({ 
          firstName: action.firstName, 
          lastName: action.lastName, 
          email: action.email, 
          password: action.password 
        })
      }

      // Registration always requires email verification
      if (data.requiresEmailVerification) {
        setVerifyModal({
          purpose: 'email',
          userId: data.user?.id,
          email: data.user?.email || action.email,
        })
        return
      }

      // Fallback: if somehow verification is not required
      completeAuth(data)
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTermsConfirm = () => {
    setTermsModalOpen(false)
    if (pendingAction) {
      executeRegister(pendingAction)
      setPendingAction(null)
    }
  }

  const handleVerifySuccess = (data) => {
    completeAuth(data)
    setVerifyModal(null)
    // Navigation handled by AuthContext — user will be redirected to dashboard by protected route
    window.location.href = '/user/dashboard'
  }

  const handleResendCode = async () => {
    if (!verifyModal?.userId) return
    await resendVerification(verifyModal.userId, 'EmailVerification')
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
    isSubmitting,
    serverError,
    validate,
    handleSubmit,
    verifyModal,
    setVerifyModal,
    handleVerifySuccess,
    handleResendCode,
    termsModalOpen,
    setTermsModalOpen,
    clickPos,
    handleTermsConfirm,
  }
}
