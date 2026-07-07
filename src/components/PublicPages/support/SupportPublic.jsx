import { useState, useEffect } from 'react'
import { useSupportPublic } from './SupportPublic.js'
import { Link } from 'react-router-dom'
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
    isChatOpen,
    setIsChatOpen,
    name,
    setName,
    category,
    setCategory,
    message,
    setMessage,
    chatInput,
    setChatInput,
    messages,
    setMessages,
    isTyping,
    messagesContainerRef,
    chatSectionRef,
    handleFormSubmit,
    handleSendMessage,
  } = useSupportPublic()

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('support-no-scroll')
      document.documentElement.classList.add('support-no-scroll')
    } else {
      document.body.classList.remove('support-no-scroll')
      document.documentElement.classList.remove('support-no-scroll')
    }

    return () => {
      document.body.classList.remove('support-no-scroll')
      document.documentElement.classList.remove('support-no-scroll')
    }
  }, [isModalOpen])

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
        <section className={`support-page__hero${hasBanner || isChatOpen ? '' : ' support-page__hero--no-media'}`} aria-labelledby="support-title">
          <div className="support-page__hero-content">
            <p className="support-page__eyebrow" data-lang-key="heroEyebrow">{t(supportLang, 'heroEyebrow')}</p>
            <h1 id="support-title" data-lang-key="heroTitle">{t(supportLang, 'heroTitle')}</h1>

            <div className="support-page__hero-actions">
              <button
                onClick={() => setIsModalOpen(true)}
                className="support-page__button support-page__button--primary"
                data-lang-key="openTicket"
              >
                {t(supportLang, 'openTicket')}
              </button>
              <button
                onClick={() => setIsChatOpen(true)}
                className="support-page__button support-page__button--light"
                data-lang-key="startChat"
              >
                {t(supportLang, 'startChat')}
              </button>
            </div>

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
          </div>

          {(hasBanner || isChatOpen) && (
          <div className="support-page__hero-media" ref={chatSectionRef} aria-label="NeoBank support campaign">
            {isChatOpen ? (
              <div className="support-chat">
                <div className="support-chat__header">
                  <div className="support-chat__avatar">S</div>
                  <div className="support-chat__agent-info">
                    <strong>Sarah</strong>
                    <span>Online • NeoBank Agent</span>
                  </div>
                  <button
                    className="support-chat__reset-btn"
                    onClick={() => {
                      setIsChatOpen(false)
                      setName('')
                      setMessage('')
                      setMessages([])
                    }}
                    title="End chat and reset"
                  >
                    Reset
                  </button>
                </div>

                <div className="support-chat__messages" ref={messagesContainerRef}>
                  {messages.map((msg) => (
                    <div className={`support-chat__message-wrapper ${msg.sender}`} key={msg.id}>
                      <div className="support-chat__message-bubble">
                        <p>{msg.text}</p>
                        <span className="support-chat__message-time">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="support-chat__message-wrapper support typing">
                      <div className="support-chat__message-bubble">
                        <div className="typing-indicator">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form className="support-chat__input-area" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={t(supportLang, 'chatInputPlaceholder')}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" disabled={!chatInput.trim()}>
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <>
                <img src={bannerImage} alt="NeoBank support" />
                <p className="support-page__media-copy" data-lang-key="mediaCopy">
                  {setting?.mediaText || t(supportLang, 'mediaCopy')}
                </p>
              </>
            )}
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
              <button
                onClick={() => setIsModalOpen(true)}
                className="support-page__button support-page__button--primary"
                data-lang-key="submitTicket"
              >
                {t(supportLang, 'submitTicket')}
              </button>
            </div>
          </section>
        </section>
      </main>

      {isModalOpen && (
        <div className="support-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <button className="support-modal__close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h2 data-lang-key="createTicketTitle">{t(supportLang, 'createTicketTitle')}</h2>
            <p className="support-modal__subtitle" data-lang-key="createTicketDesc">{t(supportLang, 'createTicketDesc')}</p>

            <form onSubmit={handleFormSubmit} className="support-modal__form">
              <div className="support-modal__group">
                <label data-lang-key="yourName">{t(supportLang, 'yourName')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="support-modal__group">
                <label data-lang-key="category">{t(supportLang, 'category')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="" disabled data-lang-key="selectCategory">{t(supportLang, 'selectCategory')}</option>
                  <option value="account" data-lang-key="catAccount">{t(supportLang, 'catAccount')}</option>
                  <option value="cards" data-lang-key="catCards">{t(supportLang, 'catCards')}</option>
                  <option value="transactions" data-lang-key="catTransactions">{t(supportLang, 'catTransactions')}</option>
                  <option value="loans" data-lang-key="catLoans">{t(supportLang, 'catLoans')}</option>
                  <option value="other" data-lang-key="catOther">{t(supportLang, 'catOther')}</option>
                </select>
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
    </div>
  )
}

export default SupportPublic
