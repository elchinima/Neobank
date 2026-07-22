import { useState, useEffect } from 'react'
import { useSupportPublic } from './SupportPublic.js'
import { Link, useNavigate } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import supportBanner from '../../../assets/images/support_banner_az.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { usePublicPageSetting } from '../../../app/hooks/usePublicContent'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { supportLang } from './lang.js'
import './SupportPublic.scss'
import './SupportPublic_Responsive.scss'

function SupportPublic() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [authErrorModal, setAuthErrorModal] = useState(false)
  const [closingModal, setClosingModal] = useState(null)
  const [clickPos, setClickPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const { setting } = usePublicPageSetting('support')
  const bannerImage = setting?.bannerImageUrl ?? supportBanner
  const hasBanner = bannerImage !== ''

  const stats = [
    { labelKey: 'stat0Label', value: '2 min', subKey: 'stat0Sub' },
    { labelKey: 'stat1Label', value: '99.2%', subKey: 'stat1Sub' },
    { labelKey: 'stat2Label', value: '24/7', subKey: 'stat2Sub' },
    { labelKey: 'stat3Label', value: '4.9/5', subKey: 'stat3Sub', mobileOnly: true },
  ]

  const {
    isModalOpen,
    setIsModalOpen,
    name,
    setName,
    category,
    setCategory,
    chatLanguage,
    setChatLanguage,
    message,
    setMessage,
    handleFormSubmit,
    hasActiveChat,
    handleOpenChat,
  } = useSupportPublic()

  const handleCloseModal = (type, e) => {
    if (e && e.clientX !== undefined && e.clientY !== undefined) {
      setClickPos({ x: e.clientX, y: e.clientY })
    }
    setClosingModal(type)
    setTimeout(() => {
      if (type === 'auth') setAuthErrorModal(false)
      if (type === 'ticket') setIsModalOpen(false)
      setClosingModal(null)
    }, 400)
  }

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (isModalOpen) handleCloseModal('ticket')
        if (authErrorModal) handleCloseModal('auth')
      }
    }
    
    if (isModalOpen || closingModal === 'ticket') {
      document.body.classList.add('support-no-scroll')
      document.documentElement.classList.add('support-no-scroll')
      window.addEventListener('keydown', handleEsc)
    } else {
      document.body.classList.remove('support-no-scroll')
      document.documentElement.classList.remove('support-no-scroll')
      window.removeEventListener('keydown', handleEsc)
    }

    if (authErrorModal || closingModal === 'auth') {
      window.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.body.classList.remove('support-no-scroll')
      document.documentElement.classList.remove('support-no-scroll')
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isModalOpen, closingModal, authErrorModal])

  return (
    <div className="support-page">
      <nav className="support-page__nav" aria-label="Support navigation">
        <Link className="support-page__brand" to="/" aria-label="NeoBank home">
          <span className="support-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="support-page__brand-name">NeoBank</span>
        </Link>

        <div className="support-page__nav-links">
          <Link to="/" data-lang-key="navHome">{t(supportLang, 'navHome')}</Link>
          <Link to="/cards" data-lang-key="navCards">{t(supportLang, 'navCards')}</Link>
          <Link to="/loans" data-lang-key="navLoans">{t(supportLang, 'navLoans')}</Link>
          <Link to="/deposits" data-lang-key="navDeposits">{t(supportLang, 'navDeposits')}</Link>
          <Link to="/cashback" data-lang-key="navCashback">{t(supportLang, 'navCashback')}</Link>
        </div>

        <div className="support-page__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <>
              <Link to="/login" className="support-page__button support-page__button--ghost" data-lang-key="signIn">
                {t(supportLang, 'signIn')}
              </Link>
              <Link to="/register" className="support-page__button support-page__button--primary" data-lang-key="openAccount">
                {t(supportLang, 'openAccount')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="support-page__main">
        <section className={`support-page__hero${hasBanner ? '' : ' support-page__hero--no-media'}`} aria-labelledby="support-title">
          <div className="support-page__hero-content">
            <p className="support-page__eyebrow" data-lang-key="heroEyebrow">{t(supportLang, 'heroEyebrow')}</p>
            <h1 id="support-title" data-lang-key="heroTitle">{t(supportLang, 'heroTitle')}</h1>

            <div className="support-page__hero-actions">
              {hasActiveChat ? (
                <button
                  onClick={handleOpenChat}
                  className="support-page__button support-page__button--primary"
                  data-lang-key="enterChat"
                >
                  {t(supportLang, 'enterChat')}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    setClickPos({ x: e.clientX, y: e.clientY })
                    isAuthenticated ? setIsModalOpen(true) : setAuthErrorModal(true)
                  }}
                  className="support-page__button support-page__button--primary"
                  data-lang-key="openTicket"
                >
                  {t(supportLang, 'openTicket')}
                </button>
              )}
            </div>

            {hasBanner && (
              <div className="support-page__hero-stats" aria-label="Support statistics">
                {stats.map((stat) => (
                  <div
                    className={`support-page__hero-stat${stat.mobileOnly ? ' support-page__hero-stat--mobile-only' : ''}`}
                    key={stat.labelKey}
                  >
                    <span data-lang-key={stat.labelKey}>{t(supportLang, stat.labelKey)}</span>
                    <strong>{stat.value}</strong>
                    <small data-lang-key={stat.subKey}>{t(supportLang, stat.subKey)}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasBanner && (
          <div className="support-page__hero-media" aria-label="NeoBank support campaign">
            <img src={bannerImage} alt="NeoBank support" />
            <p className="support-page__media-copy" data-lang-key="mediaCopy">
              {setting?.mediaText || t(supportLang, 'mediaCopy')}
            </p>
          </div>
          )}
        </section>

        <section className="support-page__channels" id="faq" aria-labelledby="channels-title">
          <div className="support-page__channels-heading">
            <p className="support-page__eyebrow" data-lang-key="ticketsEyebrow">{t(supportLang, 'ticketsEyebrow')}</p>
            <h2 id="channels-title" data-lang-key="ticketsTitle">{t(supportLang, 'ticketsTitle')}</h2>
            <p data-lang-key="channelsDesc">
              {t(supportLang, 'channelsDesc')}
            </p>
          </div>

          <div className="support-page__channels-grid">
            <article className="support-page__channel-card">
              <span className="support-page__channel-index">01</span>
              <p data-lang-key="faqQ1">{t(supportLang, 'faqQ1')}</p>
              <h3 data-lang-key="faqTitle1">{t(supportLang, 'faqTitle1')}</h3>
              <span data-lang-key="faqA1">{t(supportLang, 'faqA1')}</span>
            </article>

            <article className="support-page__channel-card">
              <span className="support-page__channel-index">02</span>
              <p data-lang-key="faqQ2">{t(supportLang, 'faqQ2')}</p>
              <h3 data-lang-key="faqTitle2">{t(supportLang, 'faqTitle2')}</h3>
              <span data-lang-key="faqA2">{t(supportLang, 'faqA2')}</span>
            </article>

            <article className="support-page__channel-card">
              <span className="support-page__channel-index">03</span>
              <p data-lang-key="faqQ3">{t(supportLang, 'faqQ3')}</p>
              <h3 data-lang-key="faqTitle3">{t(supportLang, 'faqTitle3')}</h3>
              <span data-lang-key="faqA3">{t(supportLang, 'faqA3')}</span>
            </article>

            <article className="support-page__channel-card">
              <span className="support-page__channel-index">04</span>
              <p data-lang-key="faqQ4">{t(supportLang, 'faqQ4')}</p>
              <h3 data-lang-key="faqTitle4">{t(supportLang, 'faqTitle4')}</h3>
              <span data-lang-key="faqA4">{t(supportLang, 'faqA4')}</span>
            </article>
          </div>

          <section className="support-page__cta">
            <div className="support-page__cta-inner">
              <p className="support-page__eyebrow" data-lang-key="ctaEyebrow">{t(supportLang, 'ctaEyebrow')}</p>
              <h2 data-lang-key="ctaTitle">{t(supportLang, 'ctaTitle')}</h2>
              {hasActiveChat ? (
                <button
                  onClick={handleOpenChat}
                  className="support-page__button support-page__button--primary"
                  data-lang-key="enterChat"
                >
                  {t(supportLang, 'enterChat')}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    setClickPos({ x: e.clientX, y: e.clientY })
                    isAuthenticated ? setIsModalOpen(true) : setAuthErrorModal(true)
                  }}
                  className="support-page__button support-page__button--primary"
                  data-lang-key="submitTicket"
                >
                  {t(supportLang, 'submitTicket')}
                </button>
              )}
            </div>
          </section>
        </section>
      </main>

      {(isModalOpen || closingModal === 'ticket') && (
        <div className={`support-modal-overlay ${closingModal === 'ticket' ? 'closing' : ''}`} onClick={(e) => handleCloseModal('ticket', e)}>
          <div 
            className={`support-modal ${closingModal === 'ticket' ? 'closing' : ''}`} 
            onClick={(e) => e.stopPropagation()}
            style={{
              '--start-x': `${clickPos.x - window.innerWidth / 2}px`,
              '--start-y': `${clickPos.y - window.innerHeight / 2}px`
            }}
          >
            <button className="support-modal__close" onClick={(e) => handleCloseModal('ticket', e)}>&times;</button>
            <h2 data-lang-key="createTicketTitle">{t(supportLang, 'createTicketTitle')}</h2>
            <p className="support-modal__subtitle" data-lang-key="createTicketDesc">{t(supportLang, 'createTicketDesc')}</p>

            <form onSubmit={handleFormSubmit} className="support-modal__form">
              <div className="support-modal__row">
                <div className="support-modal__group">
                  <label data-lang-key="yourName">{t(supportLang, 'yourName')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isAuthenticated}
                  />
                </div>

                <div className="support-modal__group">
                  <label>Ünsiyyət Dili</label>
                  <select
                    value={chatLanguage}
                    onChange={(e) => setChatLanguage(e.target.value)}
                    required
                  >
                    <option value="az">Azərbaycanca</option>
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="support-modal__group">
                <label data-lang-key="message">{t(supportLang, 'message')}</label>
                <textarea
                  rows="4"
                  required
                  placeholder={t(supportLang, 'messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
              </div>

              <button type="submit" className="support-page__button support-page__button--primary support-modal__submit" data-lang-key="submitTicket">
                {t(supportLang, 'submitTicket')}
              </button>
            </form>
          </div>
        </div>
      )}

      <PublicFooter />

      {(authErrorModal || closingModal === 'auth') && (
        <div className={`support-modal-overlay ${closingModal === 'auth' ? 'closing' : ''}`} onClick={(e) => handleCloseModal('auth', e)}>
          <div 
            className={`support-modal support-modal--auth-error ${closingModal === 'auth' ? 'closing' : ''}`} 
            onClick={(e) => e.stopPropagation()}
            style={{
              '--start-x': `${clickPos.x - window.innerWidth / 2}px`,
              '--start-y': `${clickPos.y - window.innerHeight / 2}px`
            }}
          >
            <button className="support-modal__close" onClick={(e) => handleCloseModal('auth', e)}>&times;</button>
            <div className="support-modal__auth-icon">🔒</div>
            <h2>{t(supportLang, 'authRequired')}</h2>
            <p className="support-modal__subtitle">{t(supportLang, 'authRequiredDesc')}</p>
            <div className="support-modal__auth-actions">
              <Link to="/login" className="support-page__button support-page__button--primary">
                {t(supportLang, 'goToLogin')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportPublic
