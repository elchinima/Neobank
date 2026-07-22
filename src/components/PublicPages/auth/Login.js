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

  // Terms Consent modal state
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [clickPos, setClickPos] = useState(null)

  const { login, loginWithGoogle, completeAuth, resendVerification } = useAuth()
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
      if (e && e.clientX && e.clientY) {
        setClickPos({ x: e.clientX, y: e.clientY })
      } else {
        setClickPos(null)
      }
      setPendingAction({ type: 'credentials', email, password })
      setTermsModalOpen(true)
    }
  }

  const executeLogin = async (action) => {
    setIsSubmitting(true)
    setServerError('')
    try {
      let data;
      if (action.type === 'credentials') {
        data = await login(action.email, action.password)
      } else if (action.type === 'google') {
        data = await loginWithGoogle(action.token)
      }

      if (data.requiresEmailVerification) {
        setVerifyModal({
          purpose: 'email',
          userId: data.user?.id,
          email: data.user?.email || (action.type === 'credentials' ? action.email : 'Google User'),
        })
        return
      }

      if (data.requiresTwoFactor) {
        setVerifyModal({
          purpose: '2fa',
          tempToken: data.tempToken,
          email: data.user?.email || (action.type === 'credentials' ? action.email : 'Google User'),
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

  const handleTermsConfirm = () => {
    setTermsModalOpen(false)
    if (pendingAction) {
      executeLogin(pendingAction)
      setPendingAction(null)
    }
  }

  const handleGoogleLoginSuccess = async (tokenResponse) => {
    setServerError('')
    // Since Google login trigger doesn't have a simple click event, we center the modal
    setClickPos(null)
    setPendingAction({ type: 'google', token: tokenResponse.access_token })
    setTermsModalOpen(true)
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
    handleGoogleLoginSuccess,
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
