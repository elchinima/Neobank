import { useState, useEffect } from 'react'
import { useDeposits } from './Deposits.js'
import { Link, useNavigate } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import depositsBanner from '../../../assets/images/deposits_banner_az.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { depositsLang } from './lang.js'
import './Deposits.scss'
import './Deposits_Responsive.scss'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

function Deposits() {
  const { t } = useLanguage()
  const { isAuthenticated, user, token } = useAuth()
  const navigate = useNavigate()

  const depositTypes = [
    { id: 'term', icon: 'T', name: 'Term', rate: 12.0, caption: 'Fixed return for planned goals' },
    { id: 'savings', icon: 'S', name: 'Savings', rate: 5.0, caption: 'Flexible growth with access' },
    { id: 'currency', icon: 'F', name: 'Currency', rate: 3.5, caption: 'Hold value in foreign currency' },
    { id: 'premium', icon: 'P', name: 'Premium', rate: 9.0, caption: 'Higher yield for larger balances' },
  ]

  const stats = [
    { labelKey: 'stat0Label', value: '100 AZN', subKey: 'stat0Sub' },
    { labelKey: 'stat1Label', value: '12.0%', subKey: 'stat1Sub' },
    { labelKey: 'stat2Label', value: '1-36 mo', subKey: 'stat2Sub', mobileOnly: true },
    { labelKey: 'stat3Label', value: 'AZN/USD', subKey: 'stat3Sub' },
  ]

  const {
    amount,
    setAmount,
    term,
    setTerm,
    dynamicRate,
    income,
    total,
  } = useDeposits(depositTypes)

  const [modalState, setModalState] = useState({
    isOpen: false,
    step: 'select_card',
    selectedCardId: '',
    error: ''
  })

  const [userCards, setUserCards] = useState([])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetch(`${API_BASE_URL}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUserCards(data)
            if (data.length > 0) {
              setModalState(prev => ({ ...prev, selectedCardId: data[0].id }))
            }
          }
        })
        .catch(err => console.error(err))
    }
  }, [isAuthenticated, token])

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (userCards.length === 0) {
      alert('Для открытия депозита необходимо заказать хотя бы одну карту!')
      navigate('/user/cards')
      return
    }

    setModalState({ isOpen: true, step: 'select_card', selectedCardId: userCards[0]?.id || '', error: '' })
  }

  const handleConfirmDeposit = async () => {
    if (!modalState.selectedCardId) return
    setModalState(prev => ({ ...prev, step: 'processing', error: '' }))

    try {
      const response = await fetch(`${API_BASE_URL}/deposits/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          termMonths: Number(term),
          sourceCardId: modalState.selectedCardId
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка открытия депозита')
      }

      setModalState(prev => ({ ...prev, step: 'success' }))
    } catch (err) {
      setModalState(prev => ({ ...prev, step: 'select_card', error: err.message }))
    }
  }

  const handleCloseModal = () => {
    setModalState({ isOpen: false, step: 'select_card', selectedCardId: userCards[0]?.id || '', error: '' })
  }

  return (
    <div className="deposits-page">
      <nav className="deposits-page__nav" aria-label="Deposits navigation">
        <Link className="deposits-page__brand" to="/" aria-label="NeoBank home">
          <span className="deposits-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="deposits-page__brand-name">NeoBank</span>
        </Link>

        <div className="deposits-page__nav-links">
          <Link to="/" data-lang-key="navHome">{t(depositsLang, 'navHome')}</Link>
          <Link to="/cards" data-lang-key="navCards">{t(depositsLang, 'navCards')}</Link>
          <Link to="/loans" data-lang-key="navLoans">{t(depositsLang, 'navLoans')}</Link>
          <Link to="/cashback" data-lang-key="navCashback">{t(depositsLang, 'navCashback')}</Link>
          <Link to="/support" data-lang-key="navSupport">{t(depositsLang, 'navSupport')}</Link>
        </div>

        <div className="deposits-page__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <>
              <Link to="/login" className="deposits-page__button deposits-page__button--ghost" data-lang-key="signIn">
                {t(depositsLang, 'signIn')}
              </Link>
              <Link to="/register" className="deposits-page__button deposits-page__button--primary" data-lang-key="openAccount">
                {t(depositsLang, 'openAccount')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="deposits-page__main">
        <section className="deposits-page__hero" aria-labelledby="deposits-title">
          <div className="deposits-page__hero-content">
            <p className="deposits-page__eyebrow" data-lang-key="heroEyebrow">{t(depositsLang, 'heroEyebrow')}</p>
            <h1 id="deposits-title" data-lang-key="heroTitle">{t(depositsLang, 'heroTitle')}</h1>

            <div className="deposits-page__hero-actions">
              <a className="deposits-page__button deposits-page__button--primary" href="#open-deposit" data-lang-key="calculateYield">
                {t(depositsLang, 'calculateYield')}
              </a>
              <button onClick={handleOpenModal} className="deposits-page__button deposits-page__button--light" data-lang-key="openDeposit">
                {t(depositsLang, 'openDeposit')}
              </button>
            </div>

            <div className="deposits-page__hero-stats" aria-label="Deposit overview">
              {stats.map((stat) => (
                <div
                  className={`deposits-page__hero-stat${stat.mobileOnly ? ' deposits-page__hero-stat--mobile-only' : ''}`}
                  key={stat.labelKey}
                >
                  <span data-lang-key={stat.labelKey}>{t(depositsLang, stat.labelKey)}</span>
                  <strong>{stat.value}</strong>
                  <small data-lang-key={stat.subKey}>{t(depositsLang, stat.subKey)}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="deposits-page__hero-media" aria-label="Deposit campaign carousel">
            <div className="deposits-page__carousel-slide">
              <img src={depositsBanner} alt="NeoBank deposit campaign" />
            </div>
            <p className="deposits-page__media-copy" data-lang-key="mediaCopy">
              {t(depositsLang, 'mediaCopy')}
            </p>
          </div>
        </section>

        <section className="deposits-page__plans" id="open-deposit" aria-labelledby="deposit-plans-title">
          <div className="deposits-page__plans-heading">
            <p className="deposits-page__eyebrow" data-lang-key="calculatorEyebrow">{t(depositsLang, 'calculatorEyebrow')}</p>
            <h2 id="deposit-plans-title" data-lang-key="calculatorTitle">{t(depositsLang, 'calculatorTitle')}</h2>
          </div>

          <div className="deposits-page__workspace deposits-page__workspace--unified">
            <article className="deposits-page__panel deposits-page__panel--calculator-unified">
              <div className="deposits-page__calculator-body">
                <div className="deposits-page__calculator-inputs">
                  <div className="deposits-page__group">
                    <label htmlFor="deposit-amount">
                      <span data-lang-key="amountLabel">{t(depositsLang, 'amountLabel')}</span>: <span>{Number(amount).toLocaleString()} AZN</span>
                    </label>
                    <input
                      id="deposit-amount"
                      type="range"
                      min="1000"
                      max="50000"
                      step="100"
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value))}
                    />
                  </div>

                  <div className="deposits-page__group">
                    <label htmlFor="deposit-term">
                      <span data-lang-key="termLabel">{t(depositsLang, 'termLabel')}</span>: <span>{term} <span data-lang-key="months">{t(depositsLang, 'months')}</span></span>
                    </label>
                    <input
                      id="deposit-term"
                      type="range"
                      min="6"
                      max="36"
                      step="1"
                      value={term}
                      onChange={(event) => setTerm(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="deposits-page__calculator-results">
                  <div className="deposits-page__summary-row">
                    <span data-lang-key="expectedRate">{t(depositsLang, 'expectedRate')}</span>
                    <strong className={dynamicRate === 12 ? 'deposits-page__rate--max' : ''}>
                      {dynamicRate}%
                    </strong>
                  </div>
                  <div className="deposits-page__summary-row">
                    <span data-lang-key="totalIncome">{t(depositsLang, 'totalIncome')}</span>
                    <strong>{Number(income).toLocaleString()} AZN</strong>
                  </div>

                  <div className="deposits-page__summary-total">
                    <span data-lang-key="totalBalance">{t(depositsLang, 'totalBalance')}</span>
                    <strong>{Number(total).toLocaleString()} AZN</strong>
                  </div>

                  <button
                    className="deposits-page__button deposits-page__button--primary deposits-page__button--full"
                    onClick={handleOpenModal}
                    data-lang-key="openDepositBtn"
                  >
                    {t(depositsLang, 'openDepositBtn')}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      <PublicFooter />

      {modalState.isOpen && (
        <div className="deposits-page__modal-overlay">
          <div className="deposits-page__modal">
            <button className="deposits-page__modal-close" onClick={handleCloseModal}>&times;</button>

            {modalState.step === 'select_card' && (
              <div className="deposits-page__modal-content">
                <h3 data-lang-key="selectCardTitle">{t(depositsLang, 'selectCardTitle')}</h3>
                <p data-lang-key="selectCardDesc">{t(depositsLang, 'selectCardDesc')}</p>
                {modalState.error && <p style={{ color: 'red', marginTop: '8px' }}>{modalState.error}</p>}
                <div className="deposits-page__cards">
                  {userCards.map(card => (
                    <div
                      key={card.id}
                      className={`deposits-page__card ${modalState.selectedCardId === card.id ? 'active' : ''}`}
                      onClick={() => setModalState(prev => ({ ...prev, selectedCardId: card.id }))}
                    >
                      <div className="deposits-page__card-info">
                        <strong>{card.cardType} {card.network} ({card.cardNumber.slice(-4)})</strong>
                        <span>Balance: {Number(card.balance).toFixed(2)} AZN</span>
                      </div>
                      <div className="deposits-page__card-radio">
                        <div className="radio-inner"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="deposits-page__button deposits-page__button--primary deposits-page__button--full"
                  onClick={handleConfirmDeposit}
                  disabled={!modalState.selectedCardId}
                  style={{marginTop: '32px'}}
                  data-lang-key="confirmDeposit"
                >
                  {t(depositsLang, 'confirmDeposit')}
                </button>
              </div>
            )}

            {modalState.step === 'processing' && (
              <div className="deposits-page__modal-content deposits-page__modal-content--center">
                <div className="deposits-page__spinner"></div>
                <h3 data-lang-key="processingTitle">{t(depositsLang, 'processingTitle')}</h3>
                <p data-lang-key="processingDesc">{t(depositsLang, 'processingDesc')}</p>
              </div>
            )}

            {modalState.step === 'success' && (
              <div className="deposits-page__modal-content deposits-page__modal-content--center">
                <div className="deposits-page__success-icon">✓</div>
                <h3 data-lang-key="successTitle">{t(depositsLang, 'successTitle')}</h3>
                <p data-lang-key="successDesc">{t(depositsLang, 'successDesc')}</p>
                <button
                  className="deposits-page__button deposits-page__button--primary deposits-page__button--full"
                  onClick={() => {
                    handleCloseModal()
                    navigate('/user/dashboard')
                  }}
                  style={{marginTop: '32px'}}
                  data-lang-key="done"
                >
                  {t(depositsLang, 'done')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Deposits
