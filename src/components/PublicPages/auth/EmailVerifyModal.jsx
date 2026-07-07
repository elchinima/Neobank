import { useState, useRef, useEffect, useCallback } from 'react'
import { useLanguage } from '../../../app/context/LanguageContext'
import { verifyModalLang } from './verifyModalLang.js'
import './EmailVerifyModal.scss'

const RESEND_COOLDOWN = 900 // seconds (15 minutes)

function EmailVerifyModal({
  isOpen,
  purpose,         // 'email' | '2fa'
  userId,          // for email verification
  tempToken,       // for 2fa
  email,           // display email
  onSuccess,       // called with auth response data
  onResend,        // async function to resend code
  onClose,         // optional — close/cancel
}) {
  const { t, lang } = useLanguage()
  const [digits, setDigits] = useState(Array(7).fill(''))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef([])

  const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

  useEffect(() => {
    if (isOpen) {
      setDigits(Array(7).fill(''))
      setError('')
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [isOpen])

  // Countdown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      const next = [...digits]
      next[index] = ''
      setDigits(next)
      return
    }
    // Handle paste of full code
    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 7).split('')
      const next = Array(7).fill('')
      pastedDigits.forEach((d, i) => { if (i < 7) next[i] = d })
      setDigits(next)
      const focusIndex = Math.min(pastedDigits.length, 6)
      inputRefs.current[focusIndex]?.focus()
      return
    }
    const next = [...digits]
    next[index] = cleaned
    setDigits(next)
    if (index < 6) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const code = digits.join('')

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault()
    if (code.length < 7) {
      setError(t(verifyModalLang, 'enterFullCode'))
      return
    }
    setError('')
    setIsSubmitting(true)

    try {
      let endpoint, body
      if (purpose === '2fa') {
        endpoint = `${API_BASE_URL}/auth/verify-2fa`
        body = { tempToken, code }
      } else {
        endpoint = `${API_BASE_URL}/auth/verify-email`
        body = { userId, code }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || t(verifyModalLang, 'invalidCode'))
      }

      onSuccess(data)
    } catch (err) {
      setError(err.message)
      setDigits(Array(7).fill(''))
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setIsSubmitting(false)
    }
  }, [code, purpose, tempToken, userId, API_BASE_URL, onSuccess, t])

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await onResend()
      setCooldown(RESEND_COOLDOWN)
      setDigits(Array(7).fill(''))
      setError('')
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err.message || t(verifyModalLang, 'resendError'))
    }
  }

  if (!isOpen) return null

  const isTwoFactor = purpose === '2fa'
  const title = isTwoFactor ? t(verifyModalLang, 'twoFactorTitle') : t(verifyModalLang, 'verifyEmailTitle')
  const desc = isTwoFactor ? t(verifyModalLang, 'twoFactorDesc') : t(verifyModalLang, 'verifyEmailDesc')
  const icon = isTwoFactor ? '🔐' : '✉️'

  return (
    <div className="evm-overlay" role="dialog" aria-modal="true" aria-labelledby="evm-title">
      <div className="evm-card">
        {/* Close button */}
        {onClose && (
          <button className="evm-close" onClick={onClose} aria-label="Close">✕</button>
        )}

        {/* Icon */}
        <div className="evm-icon">{icon}</div>

        {/* Title */}
        <h2 className="evm-title" id="evm-title">{title}</h2>

        {/* Description */}
        <p className="evm-desc">
          {desc}{' '}
          {email && <strong className="evm-email">{email}</strong>}
        </p>

        {/* Error */}
        {error && (
          <div className="evm-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* OTP Input */}
        <form className="evm-form" onSubmit={handleSubmit} noValidate>
          <div className="evm-digits" role="group" aria-label="Verification code">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className={`evm-digit${d ? ' evm-digit--filled' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={7}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                aria-label={`Digit ${i + 1}`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            className="evm-submit"
            disabled={isSubmitting || code.length < 7}
          >
            {isSubmitting ? (
              <span className="evm-spinner" />
            ) : (
              t(verifyModalLang, 'confirmBtn')
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="evm-resend-row">
          <span className="evm-resend-label">{t(verifyModalLang, 'didntReceive')}</span>
          <button
            className={`evm-resend-btn${cooldown > 0 ? ' evm-resend-btn--disabled' : ''}`}
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0
              ? `${t(verifyModalLang, 'resendIn')} ${cooldown}s`
              : t(verifyModalLang, 'resendCode')}
          </button>
        </div>

        {/* Expiry notice */}
        <p className="evm-expiry">{t(verifyModalLang, 'codeExpiry')}</p>
      </div>
    </div>
  )
}

export default EmailVerifyModal
