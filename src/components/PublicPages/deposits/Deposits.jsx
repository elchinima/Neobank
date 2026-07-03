import { useState } from 'react'
import { useDeposits } from './Deposits.js'
import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import depositsBanner from '../../../assets/images/deposits_banner_az.png'
import './Deposits.scss'
import './Deposits_Responsive.scss'

const depositTypes = [
  { id: 'term', icon: 'T', name: 'Term', rate: 12.0, caption: 'Fixed return for planned goals' },
  { id: 'savings', icon: 'S', name: 'Savings', rate: 5.0, caption: 'Flexible growth with access' },
  { id: 'currency', icon: 'F', name: 'Currency', rate: 3.5, caption: 'Hold value in foreign currency' },
  { id: 'premium', icon: 'P', name: 'Premium', rate: 9.0, caption: 'Higher yield for larger balances' },
]

const stats = [
  { label: 'Minimum opening', value: '100 AZN', sub: 'Start small' },
  { label: 'Top annual rate', value: '9.0%', sub: 'Premium plan' },
  { label: 'Flexible terms', value: '1-36 mo', sub: 'Choose maturity', mobileOnly: true },
  { label: 'Currencies', value: 'AZN/USD', sub: 'Local and foreign' },
]

function Deposits() {
  const {
    selected,
    setSelected,
    amount,
    setAmount,
    term,
    setTerm,
    selectedType,
    dynamicRate,
    income,
    total,
  } = useDeposits(depositTypes)

  const [modalState, setModalState] = useState({
    isOpen: false,
    step: 'select_card',
    selectedCardId: 1
  })

  const mockCards = [
    { id: 1, type: 'Visa', number: '•••• 4242', balance: 125000 },
    { id: 2, type: 'Mastercard', number: '•••• 8899', balance: 350 },
  ]

  const handleOpenModal = () => {
    setModalState({ isOpen: true, step: 'select_card', selectedCardId: 1 })
  }

  const handleConfirmDeposit = () => {
    setModalState(prev => ({ ...prev, step: 'processing' }))
    setTimeout(() => {
      setModalState(prev => ({ ...prev, step: 'success' }))
    }, 2000)
  }

  const handleCloseModal = () => {
    setModalState({ isOpen: false, step: 'select_card', selectedCardId: 1 })
  }

  return (
    <div className="deposits-page">
      <nav className="deposits-page__nav" aria-label="Deposits navigation">
        <Link className="deposits-page__brand" to="/" aria-label="NeoBank home">
          <span className="deposits-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="deposits-page__brand-name">NeoBank</span>
        </Link>

        <div className="deposits-page__nav-links">
          <Link to="/">Home</Link>
          <Link to="/cards">Cards</Link>
          <Link to="/loans">Loans</Link>
          <Link to="/cashback">Cashback</Link>
          <Link to="/support">Support</Link>
        </div>

        <div className="deposits-page__nav-actions">
          <Link to="/login" className="deposits-page__button deposits-page__button--ghost">
            Sign in
          </Link>
          <Link to="/register" className="deposits-page__button deposits-page__button--primary">
            Open account
          </Link>
        </div>
      </nav>

      <main className="deposits-page__main">
        <section className="deposits-page__hero" aria-labelledby="deposits-title">
          <div className="deposits-page__hero-content">
            <p className="deposits-page__eyebrow">NeoBank Deposits</p>
            <h1 id="deposits-title">Turn idle money into planned growth.</h1>

            <div className="deposits-page__hero-actions">
              <a className="deposits-page__button deposits-page__button--primary" href="#open-deposit">
                Calculate return
              </a>
            </div>

            <div className="deposits-page__hero-stats" aria-label="Deposit overview">
              {stats.map((stat) => (
                <div
                  className={`deposits-page__hero-stat${stat.mobileOnly ? ' deposits-page__hero-stat--mobile-only' : ''}`}
                  key={stat.label}
                >
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.sub}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="deposits-page__hero-media" aria-label="Deposit campaign carousel">
            <div className="deposits-page__carousel-slide">
              <img src={depositsBanner} alt="NeoBank deposit campaign" />
            </div>
            <p className="deposits-page__media-copy">
              Compare deposit options, calculate your expected return, and open a new
              plan from the same page. The campaign visual is ready to become a carousel
              when more deposit offers are added.
            </p>
          </div>
        </section>

        <section className="deposits-page__plans" id="open-deposit" aria-labelledby="deposit-plans-title">
          <div className="deposits-page__plans-heading">
            <p className="deposits-page__eyebrow">Calculator</p>
            <h2 id="deposit-plans-title">Tune the numbers.</h2>
            <p>
              Calculate your expected return and open a deposit with up to 12% annual interest.
            </p>
          </div>

          <div className="deposits-page__workspace deposits-page__workspace--unified">
            <article className="deposits-page__panel deposits-page__panel--calculator-unified">
              <div className="deposits-page__calculator-body">
                <div className="deposits-page__calculator-inputs">
                  <div className="deposits-page__group">
                    <label htmlFor="deposit-amount">
                      Amount: <span>{Number(amount).toLocaleString()} AZN</span>
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
                      Term: <span>{term} months</span>
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
                    <span>Interest rate</span>
                    <strong className={dynamicRate === 12 ? 'deposits-page__rate--max' : ''}>
                      {dynamicRate}% yearly
                    </strong>
                  </div>
                  <div className="deposits-page__summary-row">
                    <span>Expected Income</span>
                    <strong>+{income} AZN</strong>
                  </div>

                  <div className="deposits-page__summary-total">
                    <span>Total at maturity</span>
                    <strong>{Number(total).toLocaleString()} AZN</strong>
                  </div>
                  
                  <button 
                    className="deposits-page__button deposits-page__button--primary deposits-page__button--full" 
                    type="button"
                    onClick={handleOpenModal}
                  >
                    Open deposit
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
                <h3>Select Funding Card</h3>
                <p>Choose a card to fund your {amount.toLocaleString()} AZN deposit.</p>
                <div className="deposits-page__cards">
                  {mockCards.map(card => (
                    <div 
                      key={card.id} 
                      className={`deposits-page__card ${modalState.selectedCardId === card.id ? 'active' : ''} ${card.balance < amount ? 'disabled' : ''}`}
                      onClick={() => card.balance >= amount && setModalState(prev => ({ ...prev, selectedCardId: card.id }))}
                    >
                      <div className="deposits-page__card-info">
                        <strong>{card.type} {card.number}</strong>
                        <span>Balance: {card.balance.toLocaleString()} AZN</span>
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
                  disabled={!mockCards.find(c => c.id === modalState.selectedCardId) || mockCards.find(c => c.id === modalState.selectedCardId).balance < amount}
                  style={{marginTop: '32px'}}
                >
                  Confirm & Open Deposit
                </button>
              </div>
            )}

            {modalState.step === 'processing' && (
              <div className="deposits-page__modal-content deposits-page__modal-content--center">
                <div className="deposits-page__spinner"></div>
                <h3>Processing...</h3>
                <p>Please wait while we open your deposit account.</p>
              </div>
            )}

            {modalState.step === 'success' && (
              <div className="deposits-page__modal-content deposits-page__modal-content--center">
                <div className="deposits-page__success-icon">✓</div>
                <h3>Success!</h3>
                <p>Your deposit of <strong>{amount.toLocaleString()} AZN</strong> has been successfully opened at {dynamicRate}% APY.</p>
                <button 
                  className="deposits-page__button deposits-page__button--primary deposits-page__button--full" 
                  onClick={handleCloseModal}
                  style={{marginTop: '32px'}}
                >
                  Done
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
