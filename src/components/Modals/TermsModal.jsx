import React, { useState, useEffect } from 'react'
import { useLanguage } from '../../app/context/LanguageContext'
import { authLang } from '../PublicPages/auth/lang.js'
import { footerLang } from '../PublicFooter/lang.js'
import { usePublicContent } from '../../app/hooks/usePublicContent'
import { Turnstile } from '@marsidev/react-turnstile'
import './TermsModal.scss'

import userAgreementIcon from '../../assets/icons/Public/user_agreement.svg'
import rulesIcon from '../../assets/icons/Public/rules.svg'
import privacyPolicyIcon from '../../assets/icons/Public/privacy_policy.svg'
import personalDataIcon from '../../assets/icons/Public/personal_data_processing.svg'

function TermsModal({ isOpen, clickPos, onConfirm, onClose }) {
  const { t } = useLanguage()
  const { footerDocuments = [] } = usePublicContent()
  const [agreed, setAgreed] = useState(false)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [closingModal, setClosingModal] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setClosingModal(false)
      setAgreed(false) // reset agreement
      setCaptchaToken(null) // reset captcha
    } else if (shouldRender) {
      setClosingModal(true)
      setTimeout(() => setShouldRender(false), 400)
    }
  }, [isOpen])

  if (!shouldRender) return null

  const getDocUrl = (key) => {
    const doc = footerDocuments.find(d => d.docKey?.toLowerCase() === key.toLowerCase())
    return doc?.url || '#'
  }

  const handleClose = (e) => {
    if (onClose) onClose(e)
  }

  const handleConfirm = () => {
    if (agreed && captchaToken && onConfirm) {
      onConfirm(captchaToken)
    }
  }

  const safeClickPos = clickPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 }

  return (
    <div className={`terms-modal-overlay ${closingModal ? 'closing' : ''}`} role="dialog" aria-modal="true" onMouseDown={handleClose}>
      <div 
        className={`terms-modal-card ${closingModal ? 'closing' : ''}`}
        onMouseDown={e => e.stopPropagation()}
        style={{
          '--start-x': `${safeClickPos.x - window.innerWidth / 2}px`,
          '--start-y': `${safeClickPos.y - window.innerHeight / 2}px`
        }}
      >
        <button className="terms-modal-close" onClick={handleClose} aria-label="Close">&times;</button>
        
        <div className="terms-modal-header">
          <h2 data-lang-key="documentsTitle">{t(footerLang, 'documentsTitle')}</h2>
        </div>

        <div className="terms-modal-documents">
          <a href={getDocUrl('userAgreement')} target="_blank" rel="noreferrer" className="terms-modal-doc-link">
            <img src={userAgreementIcon} alt="" />
            <span>{t(footerLang, 'userAgreement')}</span>
          </a>
          <a href={getDocUrl('rules')} target="_blank" rel="noreferrer" className="terms-modal-doc-link">
            <img src={rulesIcon} alt="" />
            <span>{t(footerLang, 'rules')}</span>
          </a>
          <a href={getDocUrl('privacyPolicy')} target="_blank" rel="noreferrer" className="terms-modal-doc-link">
            <img src={privacyPolicyIcon} alt="" />
            <span>{t(footerLang, 'privacyPolicy')}</span>
          </a>
          <a href={getDocUrl('personalDataProcessing')} target="_blank" rel="noreferrer" className="terms-modal-doc-link">
            <img src={personalDataIcon} alt="" />
            <span>{t(footerLang, 'personalDataProcessing')}</span>
          </a>
        </div>

        <label className="terms-modal-consent">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span data-lang-key="termsAgreement">{t(authLang, 'termsAgreement')}</span>
        </label>

        <div className="terms-modal-footer">
          <div className="terms-modal-captcha">
            <Turnstile 
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
              onSuccess={(token) => setCaptchaToken(token)}
              options={{ theme: 'dark' }}
            />
          </div>
          <div className="terms-modal-actions">
            <button className="btn-cancel" onClick={handleClose}>
              {t(footerLang, 'noBtn')}
            </button>
            <button className="btn-confirm" disabled={!agreed || !captchaToken} onClick={handleConfirm}>
              {t(footerLang, 'yesBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsModal
