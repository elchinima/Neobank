import { useSupportPublic } from './SupportPublic.js'
import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import supportBanner from '../../../assets/images/support_banner_az.png'
import './SupportPublic.scss'
import './SupportPublic_Responsive.scss'

const stats = [
  { label: 'Average response', value: '2 min', sub: 'Fastest care' },
  { label: 'Resolution rate', value: '99.2%', sub: 'First contact' },
  { label: 'Availability', value: '24/7', sub: 'All year round' },
  { label: 'Satisfaction', value: '4.9/5', sub: 'User rated', mobileOnly: true },
]

function SupportPublic() {
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

  return (
    <div className="support-page">
      <nav className="support-page__nav" aria-label="Support navigation">
        <Link className="support-page__brand" to="/" aria-label="NeoBank home">
          <span className="support-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="support-page__brand-name">NeoBank</span>
        </Link>

        <div className="support-page__nav-links">
          <Link to="/">Home</Link>
          <Link to="/cards">Cards</Link>
          <Link to="/loans">Loans</Link>
          <Link to="/deposits">Deposits</Link>
          <Link to="/cashback">Cashback</Link>
        </div>

        <div className="support-page__nav-actions">
          <Link to="/login" className="support-page__button support-page__button--ghost">
            Sign in
          </Link>
          <Link to="/register" className="support-page__button support-page__button--primary">
            Open account
          </Link>
        </div>
      </nav>

      <main className="support-page__main">
        <section className="support-page__hero" aria-labelledby="support-title">
          <div className="support-page__hero-content">
            <p className="support-page__eyebrow">NeoBank Support</p>
            <h1 id="support-title">Always ready. Always here to help.</h1>

            <div className="support-page__hero-actions">
              <button
                onClick={() => setIsModalOpen(true)}
                className="support-page__button support-page__button--primary"
              >
                Get assistance
              </button>
              <a className="support-page__button support-page__button--light" href="#faq">
                Browse FAQ
              </a>
            </div>

            <div className="support-page__hero-stats" aria-label="Support statistics">
              {stats.map((stat) => (
                <div
                  className={`support-page__hero-stat${stat.mobileOnly ? ' support-page__hero-stat--mobile-only' : ''}`}
                  key={stat.label}
                >
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.sub}</small>
                </div>
              ))}
            </div>
          </div>

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
                    placeholder="Type your message..."
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
                <div className="support-page__hero-media-wrapper">
                  <img src={supportBanner} alt="NeoBank Support Team ready 24/7" />
                </div>
                <p className="support-page__media-copy">
                  Have a question about cards, accounts, deposits, or loans? Our dedicated support team is available 24/7. Open a ticket from your account to track your request to resolution, or browse our self-service guides.
                </p>
              </>
            )}
          </div>
        </section>

        <section className="support-page__channels" id="faq" aria-labelledby="channels-title">
          <div className="support-page__channels-heading">
            <p className="support-page__eyebrow">Support Channels</p>
            <h2 id="channels-title">We cover every banking detail.</h2>
            <p>
              Whether you need to report a lost card, verify a transfer, or configure deposit options,
              our support team provides dedicated assistance across multiple secure channels.
            </p>
          </div>

          <div className="support-page__channels-grid">
            <article className="support-page__channel-card">
              <span className="support-page__channel-index">01</span>
              <p>Online support</p>
              <h3>Instant Chat Support</h3>
              <span>Submit queries directly from your dashboard and track responses in real-time. Average response under 2 minutes.</span>
            </article>

            <article className="support-page__channel-card">
              <span className="support-page__channel-index">02</span>
              <p>Hotline</p>
              <h3>Card Security Hotline</h3>
              <span>Block a lost card, replace an active card, or configure transaction limits directly. Available instantly 24/7.</span>
            </article>

            <article className="support-page__channel-card">
              <span className="support-page__channel-index">03</span>
              <p>Automation</p>
              <h3>Official Telegram Bot</h3>
              <span>Get instant transaction alerts, check account balances, and locate nearest ATMs via our secure bot.</span>
            </article>

            <article className="support-page__channel-card">
              <span className="support-page__channel-index">04</span>
              <p>Direct contact</p>
              <h3>Email Assistance</h3>
              <span>For official documents, business account inquiries, or detailed feedback, write to support@neobank.az.</span>
            </article>
          </div>

          <section className="support-page__cta">
            <div className="support-page__cta-inner">
              <p className="support-page__eyebrow">Still have questions?</p>
              <h2>Our support specialists are always here to help.</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="support-page__button support-page__button--primary"
              >
                Submit support request
              </button>
            </div>
          </section>
        </section>
      </main>

      {isModalOpen && (
        <div className="support-modal-overlay">
          <div className="support-modal">
            <button className="support-modal__close" onClick={() => setIsModalOpen(false)}>×</button>
            <h3>Start Support Simulation</h3>
            <p>Fill out the details to start a simulated conversation with our automated customer care agent.</p>
            <form onSubmit={handleFormSubmit}>
              <div className="support-modal__group">
                <label htmlFor="user-name">Your Name</label>
                <input
                  id="user-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="support-modal__group">
                <label htmlFor="user-category">Category</label>
                <select
                  id="user-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General Information">General Information</option>
                  <option value="Card Issues & Limits">Card Issues & Limits</option>
                  <option value="Transfers & Payments">Transfers & Payments</option>
                  <option value="Loans & Credits">Loans & Credits</option>
                  <option value="Deposits & Savings">Deposits & Savings</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="support-modal__group">
                <label htmlFor="user-msg">How can we help you?</label>
                <textarea
                  id="user-msg"
                  required
                  rows="4"
                  placeholder="Describe your issue or question here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <button className="support-page__button support-page__button--primary" type="submit">
                Start Chat Simulation
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
