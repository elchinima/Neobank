import { useState, useEffect } from 'react'
import { useLoans } from './Loans.js'
import { Link, useNavigate } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import loansBanner from '../../../assets/images/loans_banner_az.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { usePublicPageSetting } from '../../../app/hooks/usePublicContent'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { loansLang } from './lang.js'
import './Loans.scss'
import './Loans_Responsive.scss'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

function Loans() {
  const { t } = useLanguage()
  const { isAuthenticated, user, token } = useAuth()
  const { setting } = usePublicPageSetting('loans')
  const navigate = useNavigate()
  const bannerImage = setting?.bannerImageUrl ?? loansBanner
  const hasBanner = bannerImage !== ''

  const loanTypes = [
    {
      id: 'personal',
      titleKey: 'personalLoan',
      rate: 9.9,
      limitKey: 'upTo30k',
      textKey: 'personalDesc',
    },
    {
      id: 'auto',
      titleKey: 'autoLoan',
      rate: 10.5,
      limitKey: 'upTo60k',
      textKey: 'autoDesc',
    },
    {
      id: 'business',
      titleKey: 'businessLoan',
      rate: 11.8,
      limitKey: 'upTo100k',
      textKey: 'businessDesc',
    },
  ]

  const stats = [
    { labelKey: 'stat0Label', value: '9.9%', subKey: 'stat0Sub' },
    { labelKey: 'stat1Label', value: '2 min', subKey: 'stat1Sub' },
    { labelKey: 'stat2Label', value: '84 mo', subKey: 'stat2Sub' },
    { labelKey: 'stat3Label', value: '0 AZN', subKey: 'stat3Sub', mobileOnly: true },
  ]

  const {
    amount,
    setAmount,
    term,
    setTerm,
    dynamicRate,
    monthlyPayment,
    overpayment,
  } = useLoans(loanTypes)

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
      alert('Для получения кредита необходимо заказать хотя бы одну карту!')
      navigate('/user/cards')
      return
    }

    setModalState({ isOpen: true, step: 'select_card', selectedCardId: userCards[0]?.id || '', error: '' })
  }

  const handleConfirmLoan = async () => {
    if (!modalState.selectedCardId) return
    setModalState(prev => ({ ...prev, step: 'processing', error: '' }))

    try {
      const response = await fetch(`${API_BASE_URL}/loans/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount),
          termMonths: Number(term),
          targetCardId: modalState.selectedCardId
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка оформления кредита')
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
    <div className="loans-page">
      <nav className="loans-page__nav" aria-label="Loans navigation">
        <Link className="loans-page__brand" to="/" aria-label="NeoBank home">
          <span className="loans-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="loans-page__brand-name">NeoBank</span>
        </Link>

        <div className="loans-page__nav-links">
          <Link to="/" data-lang-key="navHome">{t(loansLang, 'navHome')}</Link>
          <Link to="/cards" data-lang-key="navCards">{t(loansLang, 'navCards')}</Link>
          <Link to="/deposits" data-lang-key="navDeposits">{t(loansLang, 'navDeposits')}</Link>
          <Link to="/cashback" data-lang-key="navCashback">{t(loansLang, 'navCashback')}</Link>
          <Link to="/support" data-lang-key="navSupport">{t(loansLang, 'navSupport')}</Link>
        </div>

        <div className="loans-page__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <>
              <Link to="/login" className="loans-page__button loans-page__button--ghost" data-lang-key="signIn">
                {t(loansLang, 'signIn')}
              </Link>
              <Link to="/register" className="loans-page__button loans-page__button--primary" data-lang-key="openAccount">
                {t(loansLang, 'openAccount')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="loans-page__main">
        <section className={`loans-page__hero${hasBanner ? '' : ' loans-page__hero--no-media'}`} aria-labelledby="loans-title">
          <div className="loans-page__hero-content">
            <p className="loans-page__eyebrow" data-lang-key="heroEyebrow">{t(loansLang, 'heroEyebrow')}</p>
            <h1 id="loans-title" data-lang-key="heroTitle">{t(loansLang, 'heroTitle')}</h1>

            <div className="loans-page__hero-actions">
              <a className="loans-page__button loans-page__button--primary" href="#loan-calculator" data-lang-key="calculatePayment">
                {t(loansLang, 'calculatePayment')}
              </a>
              <button onClick={handleOpenModal} className="loans-page__button loans-page__button--light" data-lang-key="applyNow">
                {t(loansLang, 'applyNow')}
              </button>
            </div>

            <div className="loans-page__hero-stats" aria-label="Loan overview">
              {stats.map((stat) => (
                <div
                  className={`loans-page__hero-stat${stat.mobileOnly ? ' loans-page__hero-stat--mobile-only' : ''}`}
                  key={stat.labelKey}
                >
                  <span data-lang-key={stat.labelKey}>{t(loansLang, stat.labelKey)}</span>
                  <strong>{stat.value}</strong>
                  <small data-lang-key={stat.subKey}>{t(loansLang, stat.subKey)}</small>
                </div>
              ))}
            </div>
          </div>

          {hasBanner && (
            <div className="loans-page__hero-media" aria-label="NeoBank loan campaign">
              <img src={bannerImage} alt="NeoBank loan campaign" />
              <p className="loans-page__media-copy" data-lang-key="mediaCopy">
                {setting?.mediaText || t(loansLang, 'mediaCopy')}
              </p>
            </div>
          )}
        </section>

        <section className="loans-page__products" id="loan-calculator" aria-labelledby="loan-products-title">
          <div className="loans-page__products-heading">
            <p className="loans-page__eyebrow" data-lang-key="optionsEyebrow">{t(loansLang, 'optionsEyebrow')}</p>
            <h2 id="loan-products-title" data-lang-key="optionsTitle">{t(loansLang, 'optionsTitle')}</h2>
            <p data-lang-key="optionsDesc">
              {t(loansLang, 'optionsDesc')}
            </p>
          </div>

          <div className="loans-page__workspace loans-page__workspace--unified">
            <article className="loans-page__panel loans-page__panel--calculator-unified">
              <div className="loans-page__calculator-body">
                <div className="loans-page__calculator-inputs">
                  <div className="loans-page__group">
                    <label htmlFor="loan-amount">
                      <span data-lang-key="amountLabel">{t(loansLang, 'amountLabel')}</span>: <span>{Number(amount).toLocaleString()} AZN</span>
                    </label>
                    <input
                      id="loan-amount"
                      type="range"
                      min="500"
                      max="100000"
                      step="500"
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value))}
                    />
                  </div>

                  <div className="loans-page__group">
                    <label htmlFor="loan-term">
                      <span data-lang-key="termLabel">{t(loansLang, 'termLabel')}</span>: <span>{term} <span data-lang-key="months">{t(loansLang, 'months')}</span></span>
                    </label>
                    <input
                      id="loan-term"
                      type="range"
                      min="3"
                      max="84"
                      step="3"
                      value={term}
                      onChange={(event) => setTerm(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="loans-page__calculator-results">
                  <div className="loans-page__summary-row">
                    <span data-lang-key="rateLabel">{t(loansLang, 'rateLabel')}</span>
                    <strong className={dynamicRate === 9.9 ? 'loans-page__rate--min' : ''}>
                      {dynamicRate}% <span data-lang-key="perYear">{t(loansLang, 'perYear')}</span>
                    </strong>
                  </div>
                  <div className="loans-page__summary-row">
                    <span data-lang-key="totalOverpayment">{t(loansLang, 'totalOverpayment')}</span>
                    <strong>{Number(overpayment).toLocaleString()} AZN</strong>
                  </div>

                  <div className="loans-page__summary-total">
                    <span data-lang-key="monthlyPayment">{t(loansLang, 'monthlyPayment')}</span>
                    <strong>{Math.floor(Number(monthlyPayment)).toLocaleString()} AZN</strong>
                  </div>

                  <button
                    className="loans-page__button loans-page__button--primary loans-page__button--full"
                    onClick={handleOpenModal}
                    data-lang-key="takeLoan"
                  >
                    {t(loansLang, 'takeLoan')}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      <PublicFooter />

      {modalState.isOpen && (
        <div className="loans-page__modal-overlay">
          <div className="loans-page__modal">
            <button className="loans-page__modal-close" onClick={handleCloseModal}>&times;</button>

            {modalState.step === 'select_card' && (
              <div className="loans-page__modal-content">
                <h3 data-lang-key="selectCardTitle">{t(loansLang, 'selectCardTitle')}</h3>
                <p data-lang-key="selectCardDesc">{t(loansLang, 'selectCardDesc')}</p>
                {modalState.error && <p style={{ color: 'red', marginTop: '8px' }}>{modalState.error}</p>}
                <div className="loans-page__cards">
                  {userCards.map(card => (
                    <div
                      key={card.id}
                      className={`loans-page__card ${modalState.selectedCardId === card.id ? 'active' : ''}`}
                      onClick={() => setModalState(prev => ({ ...prev, selectedCardId: card.id }))}
                    >
                      <div className="loans-page__card-info">
                        <strong>{card.cardType} {card.network} ({card.cardNumber.slice(-4)})</strong>
                        <span><span data-lang-key="balance">{t(loansLang, 'balance')}</span>: {Number(card.balance).toFixed(2)} AZN</span>
                      </div>
                      <div className="loans-page__card-radio">
                        <div className="radio-inner"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="loans-page__button loans-page__button--primary loans-page__button--full"
                  onClick={handleConfirmLoan}
                  disabled={!modalState.selectedCardId}
                  style={{marginTop: '32px'}}
                  data-lang-key="confirmPayout"
                >
                  {t(loansLang, 'confirmPayout')}
                </button>
              </div>
            )}

            {modalState.step === 'processing' && (
              <div className="loans-page__modal-content loans-page__modal-content--center">
                <div className="loans-page__spinner"></div>
                <h3 data-lang-key="processingTitle">{t(loansLang, 'processingTitle')}</h3>
                <p data-lang-key="processingDesc">{t(loansLang, 'processingDesc')}</p>
              </div>
            )}

            {modalState.step === 'success' && (
              <div className="loans-page__modal-content loans-page__modal-content--center">
                <div className="loans-page__success-icon">✓</div>
                <h3 data-lang-key="successTitle">{t(loansLang, 'successTitle')}</h3>
                <p data-lang-key="successDesc">{t(loansLang, 'successDesc')}</p>
                <button
                  className="loans-page__button loans-page__button--primary loans-page__button--full"
                  onClick={() => {
                    handleCloseModal()
                    navigate('/user/dashboard')
                  }}
                  style={{marginTop: '32px'}}
                  data-lang-key="goToDashboard"
                >
                  {t(loansLang, 'goToDashboard')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Loans
