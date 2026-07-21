import { useState, useRef, useCallback } from 'react'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { settingsLang } from './lang.js'
import EmailVerifyModal from '../../../components/PublicPages/auth/EmailVerifyModal.jsx'
import './Settings.scss'
import './Settings_Responsive.scss'
import securityIcon from '../../../assets/icons/User/settings/security.svg'
import accountIcon from '../../../assets/icons/User/settings/account.svg'
import pinIcon from '../../../assets/icons/User/settings/pin.svg'
import updateIcon from '../../../assets/icons/User/settings/update.svg'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const Settings = () => {
  const { t } = useLanguage()
  const { user, token, updateUser, toggleTwoFactor, resendVerification, completeAuth , fetchWithAuth} = useAuth()
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [email, setEmail] = useState(user?.email || 'user@example.com')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled ?? false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorMsg, setTwoFactorMsg] = useState('')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null)
  const [uploadError, setUploadError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Email verification modal state (for "Verify Email" button in settings)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const fileInputRef = useRef(null)

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t(settingsLang, 'maxFileSize'))
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadingAvatar(true)
      setUploadError('')

      const res = await fetchWithAuth(`${API_BASE_URL}/user/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || t(settingsLang, 'avatarUploadError'))
      }

      setAvatarUrl(data.avatarUrl)
      if (updateUser) {
        updateUser({ avatarUrl: data.avatarUrl })
      }
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordSave = async () => {
    setPasswordError('')
    setPasswordSuccess('')
    
    if (!password.current || !password.new || !password.confirm) {
      setPasswordError(t(settingsLang, 'fillAllFields'))
      return
    }

    if (password.new.length < 8) {
      setPasswordError(t(settingsLang, 'passwordTooShort'))
      return
    }

    if (password.new === password.current) {
      setPasswordError(t(settingsLang, 'newPasswordSameAsOld'))
      return
    }

    if (password.new !== password.confirm) {
      setPasswordError(t(settingsLang, 'passwordsDoNotMatch'))
      return
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: password.current,
          newPassword: password.new
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      setPasswordSuccess(t(settingsLang, 'passwordChanged'))
      setTimeout(() => {
        setIsPasswordModalOpen(false)
        setPassword({ current: '', new: '', confirm: '' })
        setPasswordSuccess('')
      }, 2000)
    } catch (err) {
      setPasswordError(err.message)
    }
  }

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false)
    setPasswordError('')
    setPasswordSuccess('')
    setPassword({ current: '', new: '', confirm: '' })
  }

  // Handle 2FA toggle — calls the real API
  const handleTwoFactorToggle = async () => {
    const newValue = !twoFactorEnabled
    setTwoFactorLoading(true)
    setTwoFactorMsg('')
    try {
      await toggleTwoFactor(newValue)
      setTwoFactorEnabled(newValue)
      setTwoFactorMsg(newValue ? t(settingsLang, 'twoFactorEnabled') : t(settingsLang, 'twoFactorDisabled'))
      setTimeout(() => setTwoFactorMsg(''), 3000)
    } catch (err) {
      setTwoFactorMsg(t(settingsLang, 'twoFactorError'))
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // Handle verify email button in settings
  const handleVerifyEmailClick = async () => {
    if (user?.id) {
      await resendVerification(user.id, 'EmailVerification')
    }
    setShowVerifyModal(true)
  }

  const handleVerifySuccess = useCallback((data) => {
    completeAuth(data)
    setShowVerifyModal(false)
  }, [completeAuth])

  const handleVerifyResend = useCallback(async () => {
    if (user?.id) {
      await resendVerification(user.id, 'EmailVerification')
    }
  }, [user, resendVerification])

  const isEmailVerified = user?.isEmailVerified ?? false

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 data-lang-key="title">{t(settingsLang, 'title')}</h1>
      </div>

      <div className="settings-container">

        <div className="settings-card">
          <div className="card-title-row">
            <img src={accountIcon} className="card-title-icon" alt="" />
            <h2 data-lang-key="personalInfo">{t(settingsLang, 'personalInfo')}</h2>
          </div>

          <div className="profile-wrapper">
            <div className="avatar-box">
              <div className="avatar-circle">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="avatar-circle__img" />
                ) : (
                  user?.firstName?.charAt(0) || 'E'
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/png, image/jpeg, image/jpg"
                className="settings-file-input--hidden"
              />
              <button
                className="change-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                data-lang-key="changeAvatar"
              >
                {uploadingAvatar ? t(settingsLang, 'processingAvatar') : t(settingsLang, 'changeAvatar')}
              </button>
              {uploadError && <p className="upload-error-msg">{uploadError}</p>}
            </div>

            <div className="profile-info-fields">
              <div className="field-group">
                <label data-lang-key="fullName">{t(settingsLang, 'fullName')}</label>
                <input type="text" value={`${user?.firstName || 'User'} ${user?.lastName || ''}`} readOnly className="settings-input readonly" />
              </div>

              <div className="field-group">
                <label data-lang-key="email">{t(settingsLang, 'email')}</label>
                {isEmailVerified ? (
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="settings-input readonly"
                  />
                ) : (
                  <div className="input-with-button">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="settings-input"
                    />
                    <button className="save-btn" data-lang-key="saveChanges">
                      <img src={updateIcon} className="btn-icon" alt="" />
                      {t(settingsLang, 'saveChanges')}
                    </button>
                  </div>
                )}

                {/* Email verification status */}
                <div className="email-verify-status">
                  {isEmailVerified ? (
                    <span className="email-verify-badge email-verify-badge--verified">
                      ✓ {t(settingsLang, 'emailVerified')}
                    </span>
                  ) : (
                    <div className="email-verify-unverified">
                      <span className="email-verify-badge email-verify-badge--unverified">
                        ⚠ {t(settingsLang, 'emailNotVerified')}
                      </span>
                      <button
                        className="email-verify-btn"
                        onClick={handleVerifyEmailClick}
                      >
                        {t(settingsLang, 'verifyEmailNow')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="settings-card">
          <div className="card-title-row">
            <img src={securityIcon} className="card-title-icon" alt="" />
            <h2 data-lang-key="security">{t(settingsLang, 'security')}</h2>
          </div>

          <div className="security-options-list">
            <div className="security-option">
              <div className="option-info">
                <img src={pinIcon} className="option-icon" alt="" />
                <div>
                  <h3 data-lang-key="changePassword">{t(settingsLang, 'changePassword')}</h3>
                  <p data-lang-key="updatePasswordDesc">{t(settingsLang, 'updatePasswordDesc')}</p>
                </div>
              </div>
              <button className="action-button" onClick={() => setIsPasswordModalOpen(true)} data-lang-key="updatePasswordBtn">
                {t(settingsLang, 'updatePasswordBtn')}
              </button>
            </div>

            <div className="security-option">
              <div className="option-info">
                <img src={securityIcon} className="option-icon" alt="" />
                <div>
                  <h3 data-lang-key="twoFactor">{t(settingsLang, 'twoFactor')}</h3>
                  <p data-lang-key="twoFactorDesc">{t(settingsLang, 'twoFactorDesc')}</p>
                  {twoFactorMsg && (
                    <p className={`two-factor-msg ${twoFactorEnabled ? 'two-factor-msg--on' : 'two-factor-msg--off'}`}>
                      {twoFactorMsg}
                    </p>
                  )}
                </div>
              </div>
              <label className={`toggle-switch${twoFactorLoading ? ' toggle-switch--loading' : ''}`}>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={handleTwoFactorToggle}
                  disabled={twoFactorLoading}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal__header">
              <h2 data-lang-key="changePassword">{t(settingsLang, 'changePassword')}</h2>
              <button className="close-btn" onClick={closePasswordModal}>✕</button>
            </div>
            <div className="settings-modal__content">
              {passwordError && <p className="modal-error-msg">{passwordError}</p>}
              {passwordSuccess && <p className="modal-success-msg">{passwordSuccess}</p>}
            <div className="field-group">
              <label data-lang-key="currentPassword">{t(settingsLang, 'currentPassword')}</label>
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                className="settings-input"
              />
            </div>
            <div className="field-group">
              <label data-lang-key="newPassword">{t(settingsLang, 'newPassword')}</label>
              <input
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                className="settings-input"
              />
            </div>
            <div className="field-group">
              <label data-lang-key="confirmPassword">{t(settingsLang, 'confirmPassword')}</label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                className="settings-input"
              />
            </div>
            <div className="settings-modal__footer">
              <button className="modal-btn cancel" onClick={closePasswordModal}>{t(settingsLang, 'cancel')}</button>
              <button className="modal-btn save" onClick={handlePasswordSave} data-lang-key="updatePasswordBtn">
                {t(settingsLang, 'updatePasswordBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Email verification modal (from settings page) */}
      <EmailVerifyModal
        isOpen={showVerifyModal}
        purpose="email"
        userId={user?.id}
        email={user?.email}
        onSuccess={handleVerifySuccess}
        onResend={handleVerifyResend}
        onClose={() => setShowVerifyModal(false)}
      />
    </div>
  )
}

export default Settings

