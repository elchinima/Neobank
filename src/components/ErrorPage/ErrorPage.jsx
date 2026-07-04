import { useLocation, useNavigate, Link } from 'react-router-dom'
import logoMark from '../../assets/logo/main_logo.png'
import { useLanguage } from '../../app/context/LanguageContext'
import { useAuth } from '../../app/context/AuthContext'
import PublicFooter from '../PublicFooter/PublicFooter'
import NavUserProfile from '../NavUserProfile/NavUserProfile'
import { errorLang } from './lang.js'
import './ErrorPage.scss'

export default function ErrorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, lang, setLang } = useLanguage()
  const { isAuthenticated, user } = useAuth()

  // Extract code from state or query params or default to 404
  const queryParams = new URLSearchParams(location.search)
  const rawCode = location.state?.code || queryParams.get('code') || '404'
  const statusCode = String(rawCode).trim()

  // Custom title or message passed via state
  const customTitle = location.state?.title
  const customMessage = location.state?.message

  // Determine translation keys
  const titleKey = `${statusCode}_title`
  const descKey = `${statusCode}_desc`

  // Fallback category detection (4xx vs 5xx)
  const codeNum = parseInt(statusCode, 10)
  const is4xx = !isNaN(codeNum) && codeNum >= 400 && codeNum < 500
  const is5xx = !isNaN(codeNum) && codeNum >= 500 && codeNum < 600

  let title = customTitle || t(errorLang, titleKey)
  if (title === titleKey) {
    title = is4xx ? t(errorLang, '4xx_title') : is5xx ? t(errorLang, '5xx_title') : t(errorLang, 'unknown_title')
  }

  let description = customMessage || t(errorLang, descKey)
  if (description === descKey) {
    description = is4xx ? t(errorLang, '4xx_desc') : is5xx ? t(errorLang, '5xx_desc') : t(errorLang, 'unknown_desc')
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className={`error-page ${is5xx ? 'error-page--server' : 'error-page--client'}`}>
      <nav className="error-page__nav" aria-label="NeoBank navigation">
        <Link className="error-page__brand" to="/" aria-label="NeoBank home">
          <span className="error-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="error-page__brand-name">NeoBank</span>
        </Link>

        <div className="error-page__nav-actions">
          <div className="error-page__lang-switcher">
            {['az', 'en', 'ru'].map((l) => (
              <button
                key={l}
                className={`error-page__lang-btn ${lang === l ? 'error-page__lang-btn--active' : ''}`}
                onClick={() => setLang(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <Link to="/login" className="error-page__button error-page__button--ghost">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="error-page__main">
        <div className="error-page__card-container">
          <div className="error-page__glow-backdrop" />

          <div className="error-page__card">
            <div className="error-page__badge-wrapper">
              <span className="error-page__code-badge">{statusCode}</span>
            </div>

            <h1 className="error-page__title">{title}</h1>
            <p className="error-page__description">{description}</p>

            <div className="error-page__actions">
              <Link to="/" className="error-page__button error-page__button--primary">
                {t(errorLang, 'goHome')}
              </Link>

              {isAuthenticated && (
                <Link to="/user/dashboard" className="error-page__button error-page__button--secondary">
                  {t(errorLang, 'goDashboard')}
                </Link>
              )}

              <button onClick={handleReload} className="error-page__button error-page__button--ghost">
                {t(errorLang, 'reloadPage')}
              </button>

              <button onClick={handleGoBack} className="error-page__button error-page__button--subtle">
                {t(errorLang, 'goBack')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
