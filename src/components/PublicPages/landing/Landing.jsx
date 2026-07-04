import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import logoWithText from '../../../assets/logo/main_logo_with_text.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { landingLang } from './lang.js'
import './Landing.scss'

function Landing() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()

  const products = [
    {
      labelKey: 'prod0Label',
      titleKey: 'prod0Title',
      textKey: 'prod0Text',
    },
    {
      labelKey: 'prod1Label',
      titleKey: 'prod1Title',
      textKey: 'prod1Text',
    },
    {
      labelKey: 'prod2Label',
      titleKey: 'prod2Title',
      textKey: 'prod2Text',
    },
    {
      labelKey: 'prod3Label',
      titleKey: 'prod3Title',
      textKey: 'prod3Text',
    },
  ]

  const highlights = [
    { value: '2 min', labelKey: 'avgSignup' },
    { value: '24/7', labelKey: 'accountAccess' },
    { value: '2FA', labelKey: 'protectedLogin' },
  ]

  const securityItemKeys = ['sec0', 'sec1', 'sec2']

  return (
    <div className="landing">
      <nav className="landing__nav" aria-label="Main navigation">
        <a className="landing__brand" href="#top" aria-label="NeoBank home">
          <span className="landing__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="landing__brand-name">NeoBank</span>
        </a>

        <div className="landing__nav-links">
          <Link to="/cards" data-lang-key="navCards">{t(landingLang, 'navCards')}</Link>
          <Link to="/loans" data-lang-key="navLoans">{t(landingLang, 'navLoans')}</Link>
          <Link to="/deposits" data-lang-key="navDeposits">{t(landingLang, 'navDeposits')}</Link>
          <Link to="/cashback" data-lang-key="navCashback">{t(landingLang, 'navCashback')}</Link>
          <Link to="/support" data-lang-key="navSupport">{t(landingLang, 'navSupport')}</Link>
        </div>

        <div className="landing__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <>
              <Link to="/login" className="landing__button landing__button--ghost" data-lang-key="signIn">
                {t(landingLang, 'signIn')}
              </Link>
              <Link to="/register" className="landing__button landing__button--primary" data-lang-key="openAccount">
                {t(landingLang, 'openAccount')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main id="top">
        <section className="landing__hero" aria-labelledby="landing-title">
          <div className="landing__hero-overlay" />
          <div className="landing__hero-inner">
            <p className="landing__eyebrow" data-lang-key="eyebrowSmarter">{t(landingLang, 'eyebrowSmarter')}</p>
            <h1 id="landing-title" data-lang-key="heroTitle">{t(landingLang, 'heroTitle')}</h1>
            <p className="landing__hero-copy" data-lang-key="heroCopy">
              {t(landingLang, 'heroCopy')}
            </p>

            <div className="landing__hero-actions">
              <Link to="/register" className="landing__button landing__button--primary" data-lang-key="getStarted">
                {t(landingLang, 'getStarted')}
              </Link>
              <Link to="/login" className="landing__button landing__button--light" data-lang-key="viewDashboard">
                {t(landingLang, 'viewDashboard')}
              </Link>
            </div>

            <div className="landing__hero-stats" aria-label="NeoBank highlights">
              {highlights.map((item) => (
                <div className="landing__hero-stat" key={item.labelKey}>
                  <strong>{item.value}</strong>
                  <span data-lang-key={item.labelKey}>{t(landingLang, item.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing__hero-logo" aria-label="NeoBank visual identity">
            <img src={logoWithText} alt="NeoBank - Smarter Banking" />
          </div>
        </section>

        <section className="landing__products" id="products">
          <div className="landing__section-heading">
            <p className="landing__eyebrow" data-lang-key="eyebrowOneSurface">{t(landingLang, 'eyebrowOneSurface')}</p>
            <h2 data-lang-key="headingEverything">{t(landingLang, 'headingEverything')}</h2>
          </div>

          <div className="landing__products-grid">
            {products.map((product, index) => (
              <article className="landing__product-card" key={product.titleKey}>
                <span className="landing__product-index">{String(index + 1).padStart(2, '0')}</span>
                <p data-lang-key={product.labelKey}>{t(landingLang, product.labelKey)}</p>
                <h3 data-lang-key={product.titleKey}>{t(landingLang, product.titleKey)}</h3>
                <span data-lang-key={product.textKey}>{t(landingLang, product.textKey)}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing__control">
          <div className="landing__control-copy">
            <p className="landing__eyebrow" data-lang-key="eyebrowControl">{t(landingLang, 'eyebrowControl')}</p>
            <h2 data-lang-key="headingControl">{t(landingLang, 'headingControl')}</h2>
            <p data-lang-key="textControl">
              {t(landingLang, 'textControl')}
            </p>
          </div>

          <div className="landing__dashboard-preview" aria-label="Account overview preview">
            <div className="landing__preview-header">
              <span data-lang-key="previewOverview">{t(landingLang, 'previewOverview')}</span>
              <strong>12,450.00 AZN</strong>
            </div>
            <div className="landing__preview-row">
              <span data-lang-key="previewDepProgress">{t(landingLang, 'previewDepProgress')}</span>
              <strong>72%</strong>
            </div>
            <div className="landing__preview-row">
              <span data-lang-key="previewPremiumCard">{t(landingLang, 'previewPremiumCard')}</span>
              <strong data-lang-key="previewActive">{t(landingLang, 'previewActive')}</strong>
            </div>
            <div className="landing__preview-row">
              <span data-lang-key="previewCashback">{t(landingLang, 'previewCashback')}</span>
              <strong>84.20 AZN</strong>
            </div>
          </div>
        </section>

        <section className="landing__security" id="security">
          <div>
            <p className="landing__eyebrow" data-lang-key="eyebrowSecurity">{t(landingLang, 'eyebrowSecurity')}</p>
            <h2 data-lang-key="headingSecurity">{t(landingLang, 'headingSecurity')}</h2>
          </div>

          <ul className="landing__security-list">
            {securityItemKeys.map((key) => (
              <li key={key} data-lang-key={key}>{t(landingLang, key)}</li>
            ))}
          </ul>
        </section>

        <section className="landing__support" id="support">
          <p className="landing__eyebrow" data-lang-key="eyebrowReady">{t(landingLang, 'eyebrowReady')}</p>
          <h2 data-lang-key="headingReady">{t(landingLang, 'headingReady')}</h2>
          <Link to="/register" className="landing__button landing__button--primary" data-lang-key="createAccount">
            {t(landingLang, 'createAccount')}
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

export default Landing
