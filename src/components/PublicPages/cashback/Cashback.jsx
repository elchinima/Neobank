import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import cashbackBanner from '../../../assets/images/cashback_banner_az.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { cashbackLang } from './lang.js'
import './Cashback.scss'
import './Cashback_Responsive.scss'

function Cashback() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()

  const categoryProgram = [
    { titleKey: 'cat0Title', rate: '100%', textKey: 'cat0Text' },
    { titleKey: 'cat1Title', rate: '5%', textKey: 'cat1Text' },
    { titleKey: 'cat2Title', rate: '3%', textKey: 'cat2Text' },
    { titleKey: 'cat3Title', rate: '3%', textKey: 'cat3Text' },
    { titleKey: 'cat4Title', rate: '2%', textKey: 'cat4Text' },
    { titleKey: 'cat5Title', rate: '2%', textKey: 'cat5Text' },
    { titleKey: 'cat6Title', rate: '1%', textKey: 'cat6Text' },
    { titleKey: 'cat7Title', rate: '0.1%', textKey: 'cat7Text' },
  ]

  const stats = [
    { labelKey: 'stat0Label', value: '100%', subKey: 'stat0Sub' },
    { labelKey: 'stat1Label', value: 'Up to 5%', subKey: 'stat1Sub' },
    { labelKey: 'stat2Label', value: '0.1%', subKey: 'stat2Sub', mobileOnly: true },
  ]

  return (
    <div className="cashback-page">
      <nav className="cashback-page__nav" aria-label="Cashback navigation">
        <Link className="cashback-page__brand" to="/" aria-label="NeoBank home">
          <span className="cashback-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="cashback-page__brand-name">NeoBank</span>
        </Link>

        <div className="cashback-page__nav-links">
          <Link to="/" data-lang-key="navHome">{t(cashbackLang, 'navHome')}</Link>
          <Link to="/cards" data-lang-key="navCards">{t(cashbackLang, 'navCards')}</Link>
          <Link to="/loans" data-lang-key="navLoans">{t(cashbackLang, 'navLoans')}</Link>
          <Link to="/deposits" data-lang-key="navDeposits">{t(cashbackLang, 'navDeposits')}</Link>
          <Link to="/support" data-lang-key="navSupport">{t(cashbackLang, 'navSupport')}</Link>
        </div>

        <div className="cashback-page__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <>
              <Link to="/login" className="cashback-page__button cashback-page__button--ghost" data-lang-key="signIn">
                {t(cashbackLang, 'signIn')}
              </Link>
              <Link to="/register" className="cashback-page__button cashback-page__button--primary" data-lang-key="openAccount">
                {t(cashbackLang, 'openAccount')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="cashback-page__main">
        <section className="cashback-page__hero" aria-labelledby="cashback-title">
          <div className="cashback-page__hero-content">
            <p className="cashback-page__eyebrow" data-lang-key="heroEyebrow">{t(cashbackLang, 'heroEyebrow')}</p>
            <h1 id="cashback-title" data-lang-key="heroTitle">{t(cashbackLang, 'heroTitle')}</h1>

            <div className="cashback-page__hero-actions">
              <a className="cashback-page__button cashback-page__button--primary" href="#cashback-program" data-lang-key="exploreCategories">
                {t(cashbackLang, 'exploreCategories')}
              </a>
              <Link to="/register" className="cashback-page__button cashback-page__button--light" data-lang-key="getCard">
                {t(cashbackLang, 'getCard')}
              </Link>
            </div>

            <div className="cashback-page__hero-stats" aria-label="Cashback overview">
              {stats.map((stat) => (
                <div
                  className={`cashback-page__hero-stat${stat.mobileOnly ? ' cashback-page__hero-stat--mobile-only' : ''}`}
                  key={stat.labelKey}
                >
                  <span data-lang-key={stat.labelKey}>{t(cashbackLang, stat.labelKey)}</span>
                  <strong>{stat.value}</strong>
                  <small data-lang-key={stat.subKey}>{t(cashbackLang, stat.subKey)}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="cashback-page__hero-media" aria-label="Cashback campaign preview">
            <img src={cashbackBanner} alt="NeoBank cashback campaign" />
            <p className="cashback-page__media-copy" data-lang-key="mediaCopy">
              {t(cashbackLang, 'mediaCopy')}
            </p>
          </div>
        </section>

        <section className="cashback-page__program" id="cashback-program" aria-labelledby="cashback-program-title">
          <div className="cashback-page__program-heading">
            <p className="cashback-page__eyebrow" data-lang-key="programEyebrow">{t(cashbackLang, 'programEyebrow')}</p>
            <h2 id="cashback-program-title" data-lang-key="programTitle">{t(cashbackLang, 'programTitle')}</h2>
          </div>

          <div className="cashback-page__grid">
            {categoryProgram.map((item) => (
              <article className="cashback-page__card" key={item.titleKey}>
                <div className="cashback-page__card-header">
                  <h3 data-lang-key={item.titleKey}>{t(cashbackLang, item.titleKey)}</h3>
                  <span className="cashback-page__rate-badge">{item.rate}</span>
                </div>
                <p data-lang-key={item.textKey}>{t(cashbackLang, item.textKey)}</p>
              </article>
            ))}
          </div>

          <div className="cashback-page__footer-cta">
            <Link to="/register" className="cashback-page__button cashback-page__button--primary" data-lang-key="startEarning">
              {t(cashbackLang, 'startEarning')}
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

export default Cashback
