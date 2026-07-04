import { useState, useEffect } from 'react'
import { useSupportPublic } from './SupportPublic.js'
import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import supportBanner from '../../../assets/images/support_banner_az.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { supportLang } from './lang.js'
import './SupportPublic.scss'
import './SupportPublic_Responsive.scss'

function SupportPublic() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()

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
    isTyping,
    messagesContainerRef,
    chatSectionRef,
    handleFormSubmit,
    handleSendMessage,
  } = useSupportPublic()

  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isExpanded) {
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
  }, [isExpanded])

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
        <section className={`support-page__hero ${isExpanded ? 'support-page__hero--expanded' : ''}`} aria-labelledby="support-title">
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

          <div className={`support-page__hero-media ${isExpanded ? 'support-page__hero-media--expanded' : ''}`} ref={chatSectionRef} aria-label="NeoBank support campaign">
            {isChatOpen ? (
              <div className={`support-chat ${isExpanded ? 'support-chat--expanded' : ''}`}>
                <div className="support-chat__header">
                  <div className="support-chat__avatar">S</div>
                  <div className="support-chat__agent-info">
                    <strong>Sarah</strong>
                    <span>Online • NeoBank Agent</span>
                  </div>
                  <button
                    className="support-chat__expand-btn"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Minimize chat" : "Maximize chat"}
                  >
                    {isExpanded ? '⤓' : '⤢'}
                  </button>
                  <button className="support-chat__close-btn" onClick={() => setIsChatOpen(false)}>&times;</button>
                </div>

                <div className="support-chat__messages" ref={messagesContainerRef}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`support-chat__message support-chat__message--${msg.sender}`}
                    >
                      <div className="support-chat__bubble">
                        {msg.text}
                      </div>
                      <span className="support-chat__time">{msg.time}</span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="support-chat__message support-chat__message--agent">
                      <div className="support-chat__bubble support-chat__bubble--typing">
                        <span>.</span><span>.</span><span>.</span>
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
                  <button type="submit" className="support-chat__send-btn" data-lang-key="send">
                    {t(supportLang, 'send')}
                  </button>
                </form>
              </div>
            ) : (
              <>
                <img src={supportBanner} alt="NeoBank support" />
                <p className="support-page__media-copy" data-lang-key="mediaCopy">
                  {t(supportLang, 'mediaCopy')}
                </p>
              </>
            )}
          </div>
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
