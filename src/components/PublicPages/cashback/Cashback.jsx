import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import cashbackBanner from '../../../assets/images/cashback_banner_az.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { usePublicPageSetting, API_BASE_URL } from '../../../app/hooks/usePublicContent'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { cashbackLang } from './lang.js'
import './Cashback.scss'
import './Cashback_Responsive.scss'

function Cashback() {
  const { lang, t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const { setting } = usePublicPageSetting('cashback')
  const bannerImage = setting?.bannerImageUrl ?? cashbackBanner
  const hasBanner = bannerImage !== ''

  const [dbCategories, setDbCategories] = useState([])
  const [loadingCashbacks, setLoadingCashbacks] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetch(`${API_BASE_URL}/public-content/cashbacks`)
      .then(res => {
        // Fallback to /admin/cashbacks if /cashbacks is not found or fails
        if (!res.ok && res.status === 404) {
          return fetch(`${API_BASE_URL}/admin/cashbacks`)
        }
        return res
      })
      .then(res => {
        if (!res.ok) throw new Error('Network error')
        return res.json()
      })
      .then(data => {
        if (isMounted) {
          setDbCategories(Array.isArray(data) ? data : [])
          setLoadingCashbacks(false)
        }
      })
      .catch(err => {
        console.error('Failed to load cashbacks', err)
        if (isMounted) setLoadingCashbacks(false)
      })
    return () => { isMounted = false }
  }, [])

  const variantA = dbCategories.filter(c => c.variant === 'A' || !c.variant);
  const variantB = dbCategories.filter(c => c.variant === 'B');

  const cashbackNotes = [
    'note0',
    'note1',
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
        <section className={`cashback-page__hero${hasBanner ? '' : ' cashback-page__hero--no-media'}`} aria-labelledby="cashback-title">
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
          </div>

          {hasBanner && (
            <div className="cashback-page__hero-media" aria-label="Cashback campaign preview">
              <img src={bannerImage} alt="NeoBank cashback campaign" />
              <p className="cashback-page__media-copy" data-lang-key="mediaCopy">
                {setting?.mediaText || t(cashbackLang, 'mediaCopy')}
              </p>
            </div>
          )}
        </section>
        <section className="cashback-page__plans" id="cashback-program" aria-labelledby="cashback-plans-title">
          <div className="cashback-page__plans-heading">
            <p className="cashback-page__eyebrow" data-lang-key="programEyebrow">{t(cashbackLang, 'programEyebrow')}</p>
            <h2 id="cashback-plans-title" data-lang-key="programTitle">{t(cashbackLang, 'programTitle')}</h2>
            <p data-lang-key="programDesc">
              {t(cashbackLang, 'programDesc')}
            </p>
          </div>

          <div className="cashback-page__plans-grid">
            <article className="cashback-page__plan cashback-page__plan--featured">
              <div className="cashback-page__plan-header">
                <span data-lang-key="optionA">{t(cashbackLang, 'optionA')}</span>
                <h3 data-lang-key="optionATitle">{t(cashbackLang, 'optionATitle')}</h3>
              </div>

              <div className="cashback-page__offers">
                {loadingCashbacks ? (
                  <div style={{ padding: '1rem', color: '#fff' }}>Loading cashbacks...</div>
                ) : variantA.length > 0 ? (
                  variantA.map((item) => {
                    const title = lang === 'az' ? item.titleAz : lang === 'ru' ? item.titleRu : item.titleEn;
                    const text = lang === 'az' ? item.textAz : lang === 'ru' ? item.textRu : item.textEn;
                    return (
                      <div className="cashback-page__offer" key={item.id}>
                        <strong>{item.rate}%</strong>
                        <div>
                          <h4>{title}</h4>
                          <p>{text}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '1rem', color: '#fff' }}>No cashbacks available.</div>
                )}
              </div>
            </article>

            <div className="cashback-page__or" aria-hidden="true">
              <span data-lang-key="or">{t(cashbackLang, 'or')}</span>
            </div>

            <article className="cashback-page__plan">
              <div className="cashback-page__plan-header">
                <span data-lang-key="optionB">{t(cashbackLang, 'optionB')}</span>
                <h3 data-lang-key="optionBTitle">{t(cashbackLang, 'optionBTitle')}</h3>
              </div>
              <div className="cashback-page__offers">
                {loadingCashbacks ? (
                  <div style={{ padding: '1rem', color: '#fff' }}>Loading cashbacks...</div>
                ) : variantB.length > 0 ? (
                  variantB.map((item) => {
                    const title = lang === 'az' ? item.titleAz : lang === 'ru' ? item.titleRu : item.titleEn;
                    const text = lang === 'az' ? item.textAz : lang === 'ru' ? item.textRu : item.textEn;
                    return (
                      <div className="cashback-page__offer" key={item.id}>
                        <strong>{item.rate}%</strong>
                        <div>
                          <h4>{title}</h4>
                          <p>{text}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '1rem', color: '#fff' }}>No cashbacks available for Option B.</div>
                )}
              </div>
            </article>
          </div>

          <aside className="cashback-page__notes" aria-label="Cashback notes">
            {cashbackNotes.map((noteKey, index) => (
              <div className="cashback-page__note" key={noteKey}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <p data-lang-key={noteKey}>{t(cashbackLang, noteKey)}</p>
              </div>
            ))}
          </aside>

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
