import { useLogin } from './Login.js'
import { Link } from 'react-router-dom'
import logoMark from '../../../assets/logo/main_logo.png'
import loaderIcon from '../../../assets/icons/loader.svg'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { authLang } from './lang.js'
import EmailVerifyModal from './EmailVerifyModal.jsx'
import { useGoogleLogin } from '@react-oauth/google'
import './Login.scss'
import './Login_Responsive.scss'

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
    handleGoogleLoginSuccess,
  } = useLogin()

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => console.error('Google Login Failed')
  })

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
    if (!errorMsg) return ''
    if (errorMsg === 'Invalid email or password.') return t(authLang, 'invalidCredentials')
    if (errorMsg === 'Account is disabled.') return t(authLang, 'accountDisabled')
    if (errorMsg === 'Account not found.') return t(authLang, 'accountNotFound')
    if (errorMsg.includes('Unexpected token') || errorMsg.includes('is not valid JSON')) return t(authLang, 'serverError')
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
                <p className="auth-page__eyebrow">NeoBank · {t(authLang, 'signIn')}</p>
                <h1 id="login-heading" className="auth-page__card-title" data-lang-key="signIn">
                  {t(authLang, 'signIn')}
                </h1>
                <p className="auth-page__card-sub" data-lang-key="loginDesc">{t(authLang, 'loginDesc')}</p>
              </div>

              {serverError && (
                <div className="auth-page__server-error">
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

                <div className="auth-page__submit-row">
                  <button
                    id="login-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="auth-page__button auth-page__button--primary auth-page__button--full"
                    data-lang-key="loginSubmit"
                  >
                    {isSubmitting ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="auth-page__btn-loader" />
                        {t(authLang, 'loginSubmit')}
                      </>
                    ) : (
                      t(authLang, 'loginSubmit')
                    )}
                  </button>
                  <button
                    type="button"
                    className="auth-page__button auth-page__button--google"
                    aria-label="Sign in with Google"
                    onClick={() => googleLogin()}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#000000"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#000000"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#000000"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#000000"/>
                    </svg>
                  </button>
                </div>
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