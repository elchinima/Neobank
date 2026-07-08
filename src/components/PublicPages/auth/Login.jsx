import { useLogin } from './Login.js'
import { Link } from 'react-router-dom'
import logoMark from '../../../assets/logo/main_logo.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { authLang } from './lang.js'
import EmailVerifyModal from './EmailVerifyModal.jsx'
import './Login.scss'

function Login() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    errors,
    isSubmitting,
    serverError,
    handleSubmit,
    verifyModal,
    setVerifyModal,
    handleVerifySuccess,
    handleResendCode,
  } = useLogin()

  const features = [
    {
      number: '01',
      titleKey: 'feat1Title',
      textKey: 'feat1Text',
    },
    {
      number: '02',
      titleKey: 'feat2Title',
      textKey: 'feat2Text',
    },
    {
      number: '03',
      titleKey: 'feat3Title',
      textKey: 'feat3Text',
    },
  ]

  const getTranslatedError = (errorMsg) => {
    if (errorMsg === 'Invalid email or password.') return t(authLang, 'invalidCredentials')
    if (errorMsg === 'Account is disabled.') return t(authLang, 'accountDisabled')
    return errorMsg
  }

  return (
    <div className="auth-page">
      <nav className="auth-page__nav" aria-label="NeoBank navigation">
        <Link className="auth-page__brand" to="/" aria-label="NeoBank home">
          <span className="auth-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="auth-page__brand-name">NeoBank</span>
        </Link>

        <div className="auth-page__nav-links">
          <Link to="/" data-lang-key="navHome">{t(authLang, 'navHome')}</Link>
          <Link to="/loans" data-lang-key="navLoans">{t(authLang, 'navLoans')}</Link>
          <Link to="/cashback" data-lang-key="navCashback">{t(authLang, 'navCashback')}</Link>
          <Link to="/support" data-lang-key="navSupport">{t(authLang, 'navSupport')}</Link>
        </div>

        <div className="auth-page__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <Link to="/register" className="auth-page__button auth-page__button--ghost" data-lang-key="openAccount">
              {t(authLang, 'openAccount')}
            </Link>
          )}
        </div>
      </nav>

      <main className="auth-page__main">
        <div className="auth-page__split">
          <aside className="auth-page__panel-left" aria-hidden="true">
            <div className="auth-page__panel-left-inner">
              <p className="auth-page__eyebrow" data-lang-key="loginTitle">{t(authLang, 'loginTitle')}</p>
              <h2 className="auth-page__panel-heading" data-lang-key="loginTitle">
                {t(authLang, 'loginTitle')}
              </h2>
              <p className="auth-page__panel-sub" data-lang-key="loginDesc">
                {t(authLang, 'loginDesc')}
              </p>

              <div className="auth-page__features">
                {features.map((f) => (
                  <div className="auth-page__feature" key={f.number}>
                    <span className="auth-page__feature-num">{f.number}</span>
                    <div>
                      <strong data-lang-key={f.titleKey}>{t(authLang, f.titleKey)}</strong>
                      <p data-lang-key={f.textKey}>{t(authLang, f.textKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="auth-page__form-section" aria-labelledby="login-heading">
            <div className="auth-page__card">
              <div className="auth-page__card-header">
                <p className="auth-page__eyebrow">NeoBank · Sign In</p>
                <h1 id="login-heading" className="auth-page__card-title" data-lang-key="signIn">
                  {t(authLang, 'signIn')}
                </h1>
                <p className="auth-page__card-sub" data-lang-key="loginDesc">{t(authLang, 'loginDesc')}</p>
              </div>

              {serverError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>
                  {getTranslatedError(serverError)}
                </div>
              )}

              <form className="auth-page__form" noValidate onSubmit={handleSubmit}>
                <div className={`auth-page__group${errors.email ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="login-email" data-lang-key="emailLabel">{t(authLang, 'emailLabel')}</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <span className="auth-page__error">{errors.email}</span>}
                </div>

                <div className={`auth-page__group${errors.password ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="login-password" data-lang-key="passwordLabel">{t(authLang, 'passwordLabel')}</label>
                  <div className="auth-page__input-wrap">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-page__toggle-pw"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && <span className="auth-page__error">{errors.password}</span>}
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-page__button auth-page__button--primary auth-page__button--full"
                  data-lang-key="loginSubmit"
                >
                  {isSubmitting ? '...' : t(authLang, 'loginSubmit')}
                </button>
              </form>

              <div className="auth-page__divider">
                <span data-lang-key="noAccount">{t(authLang, 'noAccount')}</span>
              </div>

              <Link
                to="/register"
                className="auth-page__button auth-page__button--ghost auth-page__button--full"
                data-lang-key="signUpNow"
              >
                {t(authLang, 'signUpNow')}
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Email / 2FA verification modal */}
      <EmailVerifyModal
        isOpen={!!verifyModal}
        purpose={verifyModal?.purpose}
        userId={verifyModal?.userId}
        tempToken={verifyModal?.tempToken}
        email={verifyModal?.email}
        onSuccess={handleVerifySuccess}
        onResend={handleResendCode}
        onClose={verifyModal?.purpose === 'email' ? () => setVerifyModal(null) : undefined}
      />
    </div>
  )
}

export default Login