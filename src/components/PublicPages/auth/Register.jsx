import { useRegister } from './Register.js'
import { Link } from 'react-router-dom'
import logoMark from '../../../assets/logo/main_logo.png'
import loaderIcon from '../../../assets/icons/loader.svg'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { authLang } from './lang.js'
import EmailVerifyModal from './EmailVerifyModal.jsx'
import './Register.scss'

function Register() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const {
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
    isSubmitting,
    serverError,
    handleSubmit,
    verifyModal,
    handleVerifySuccess,
    handleResendCode,
  } = useRegister()

  const features = [
    {
      number: '01',
      titleKey: 'regFeat1Title',
      textKey: 'regFeat1Text',
    },
    {
      number: '02',
      titleKey: 'regFeat2Title',
      textKey: 'regFeat2Text',
    },
    {
      number: '03',
      titleKey: 'regFeat3Title',
      textKey: 'regFeat3Text',
    },
  ]

  const getTranslatedError = (errorMsg) => {
    if (!errorMsg) return ''
    if (errorMsg.includes('Unexpected token') || errorMsg.includes('is not valid JSON')) return t(authLang, 'serverError')
    return errorMsg
  }

  return (
    <div className="auth-page auth-page--register">
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
            <Link to="/login" className="auth-page__button auth-page__button--ghost" data-lang-key="signIn">
              {t(authLang, 'signIn')}
            </Link>
          )}
        </div>
      </nav>

      <main className="auth-page__main">
        <div className="auth-page__split">
          <aside className="auth-page__panel-left" aria-hidden="true">
            <div className="auth-page__panel-left-inner">
              <p className="auth-page__eyebrow" data-lang-key="openAccount">{t(authLang, 'openAccount')}</p>
              <h2 className="auth-page__panel-heading" data-lang-key="registerTitle">
                {t(authLang, 'registerTitle')}
              </h2>
              <p className="auth-page__panel-sub" data-lang-key="registerDesc">
                {t(authLang, 'registerDesc')}
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

          <section className="auth-page__form-section" aria-labelledby="register-heading">
            <div className="auth-page__card">
              <div className="auth-page__card-header">
                <p className="auth-page__eyebrow">NeoBank · {t(authLang, 'registerSubmit')}</p>
                <h1 id="register-heading" className="auth-page__card-title" data-lang-key="registerTitle">
                  {t(authLang, 'openAccount')}
                </h1>
                <p className="auth-page__card-sub" data-lang-key="registerDesc">{t(authLang, 'registerDesc')}</p>
              </div>

              {serverError && (
                <div className="auth-page__server-error">
                  {getTranslatedError(serverError)}
                </div>
              )}

              <form className="auth-page__form" noValidate onSubmit={handleSubmit}>
                <div className="auth-page__row">
                  <div className={`auth-page__group${errors.firstName ? ' auth-page__group--error' : ''}`}>
                    <label htmlFor="reg-firstname" data-lang-key="firstNameLabel">{t(authLang, 'firstNameLabel')}</label>
                    <input
                      id="reg-firstname"
                      type="text"
                      placeholder={t(authLang, 'firstNamePlaceholder')}
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    {errors.firstName && <span className="auth-page__error">{errors.firstName}</span>}
                  </div>
                  <div className={`auth-page__group${errors.lastName ? ' auth-page__group--error' : ''}`}>
                    <label htmlFor="reg-lastname" data-lang-key="lastNameLabel">{t(authLang, 'lastNameLabel')}</label>
                    <input
                      id="reg-lastname"
                      type="text"
                      placeholder={t(authLang, 'lastNamePlaceholder')}
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    {errors.lastName && <span className="auth-page__error">{errors.lastName}</span>}
                  </div>
                </div>

                <div className={`auth-page__group${errors.email ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="reg-email" data-lang-key="emailLabel">{t(authLang, 'emailLabel')}</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <span className="auth-page__error">{errors.email}</span>}
                </div>

                <div className={`auth-page__group${errors.password ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="reg-password" data-lang-key="passwordLabel">{t(authLang, 'passwordLabel')}</label>
                  <div className="auth-page__input-wrap">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
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

                <div className={`auth-page__group${errors.confirm ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="reg-confirm" data-lang-key="confirmPasswordLabel">{t(authLang, 'confirmPasswordLabel')}</label>
                  <div className="auth-page__input-wrap">
                    <input
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-page__toggle-pw"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.confirm && <span className="auth-page__error">{errors.confirm}</span>}
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-page__button auth-page__button--primary auth-page__button--full"
                  data-lang-key="registerSubmit"
                >
                  {isSubmitting ? (
                    <>
                      <img src={loaderIcon} alt="Loading..." className="auth-page__btn-loader" />
                      {t(authLang, 'registerSubmit')}
                    </>
                  ) : (
                    t(authLang, 'registerSubmit')
                  )}
                </button>
              </form>

              <div className="auth-page__divider">
                <span data-lang-key="hasAccount">{t(authLang, 'hasAccount')}</span>
              </div>

              <Link
                to="/login"
                className="auth-page__button auth-page__button--ghost auth-page__button--full"
                data-lang-key="signInNow"
              >
                {t(authLang, 'signInNow')}
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Email verification modal — always shown after registration */}
      <EmailVerifyModal
        isOpen={!!verifyModal}
        purpose={verifyModal?.purpose}
        userId={verifyModal?.userId}
        email={verifyModal?.email}
        onSuccess={handleVerifySuccess}
        onResend={handleResendCode}
        // No close button for registration — user must verify email to continue
      />
    </div>
  )
}

export default Register