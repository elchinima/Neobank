import { useState } from 'react'
import { useLoans } from './Loans.js'
import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import loansBanner from '../../../assets/images/loans_banner_az.png'
import './Loans.scss'
import './Loans_Responsive.scss'

const loanTypes = [
  {
    id: 'personal',
    title: 'Personal loan',
    rate: 9.9,
    limit: 'up to 30,000 AZN',
    text: 'Flexible financing for purchases, travel, repairs, or planned expenses.',
  },
  {
    id: 'auto',
    title: 'Auto loan',
    rate: 10.5,
    limit: 'up to 60,000 AZN',
    text: 'Finance a new or used car with predictable monthly payments.',
  },
  {
    id: 'business',
    title: 'Business loan',
    rate: 11.8,
    limit: 'up to 100,000 AZN',
    text: 'Support equipment, inventory, cash flow, and growth plans.',
  },
]

const stats = [
  { label: 'Starting rate', value: '9.9%', sub: 'annual rate' },
  { label: 'Decision time', value: '2 min', sub: 'pre-check' },
  { label: 'Maximum term', value: '84 mo', sub: 'flexible schedule' },
  { label: 'Early payment', value: '0 AZN', sub: 'extra fee', mobileOnly: true },
]

const processSteps = [
  {
    number: '01',
    title: 'Choose parameters',
    text: 'Set the loan amount, term, and product type before submitting a request.',
  },
  {
    number: '02',
    title: 'Review payment',
    text: 'See the estimated monthly payment and total cost before you continue.',
  },
  {
    number: '03',
    title: 'Apply securely',
    text: 'Send your application through NeoBank and track the status in your account.',
  },
]

function Loans() {
  const {
    selected,
    setSelected,
    amount,
    setAmount,
    term,
    setTerm,
    selectedLoan,
    dynamicRate,
    monthlyPayment,
    total,
    overpayment,
  } = useLoans(loanTypes)

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

  const handleConfirmLoan = () => {
    setModalState(prev => ({ ...prev, step: 'processing' }))
    setTimeout(() => {
      setModalState(prev => ({ ...prev, step: 'success' }))
    }, 2000)
  }

  const handleCloseModal = () => {
    setModalState({ isOpen: false, step: 'select_card', selectedCardId: 1 })
  }

  return (
    <div className="loans-page">
      <nav className="loans-page__nav" aria-label="Loans navigation">
        <Link className="loans-page__brand" to="/" aria-label="NeoBank home">
          <span className="loans-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="loans-page__brand-name">NeoBank</span>
        </Link>

        <div className="loans-page__nav-links">
          <Link to="/">Home</Link>
          <Link to="/cards">Cards</Link>
          <Link to="/deposits">Deposits</Link>
          <Link to="/cashback">Cashback</Link>
          <Link to="/support">Support</Link>
        </div>

        <div className="loans-page__nav-actions">
          <Link to="/login" className="loans-page__button loans-page__button--ghost">
            Sign in
          </Link>
          <Link to="/register" className="loans-page__button loans-page__button--primary">
            Open account
          </Link>
        </div>
      </nav>

      <main className="loans-page__main">
        <section className="loans-page__hero" aria-labelledby="loans-title">
          <div className="loans-page__hero-content">
            <p className="loans-page__eyebrow">NeoBank Loans</p>
            <h1 id="loans-title">Start with a clear rate and a payment you can plan.</h1>

            <div className="loans-page__hero-actions">
              <a className="loans-page__button loans-page__button--primary" href="#loan-calculator">
                Calculate payment
              </a>
              <Link to="/loans/apply" className="loans-page__button loans-page__button--light">
                Apply now
              </Link>
            </div>

            <div className="loans-page__hero-stats" aria-label="Loan overview">
              {stats.map((stat) => (
                <div
                  className={`loans-page__hero-stat${stat.mobileOnly ? ' loans-page__hero-stat--mobile-only' : ''}`}
                  key={stat.label}
                >
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.sub}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="loans-page__hero-media" aria-label="NeoBank loan campaign">
            <img src={loansBanner} alt="NeoBank loan campaign with rate from 9.9 percent" />
            <p className="loans-page__media-copy">
              Choose the amount, compare loan types, and move from estimate to application
              without losing the overview of your monthly commitment.
            </p>
          </div>
        </section>

        <section className="loans-page__products" id="loan-calculator" aria-labelledby="loan-products-title">
          <div className="loans-page__products-heading">
            <p className="loans-page__eyebrow">Loan options</p>
            <h2 id="loan-products-title">Pick the purpose, then tune the numbers.</h2>
            <p>
              NeoBank keeps the loan journey transparent: product, rate, payment,
              term, and application path are visible from the same page.
            </p>
          </div>

          <div className="loans-page__workspace loans-page__workspace--unified">
            <article className="loans-page__panel loans-page__panel--calculator-unified">
              <div className="loans-page__calculator-body">
                <div className="loans-page__calculator-inputs">
                  <div className="loans-page__group">
                    <label htmlFor="loan-amount">
                      Amount: <span>{Number(amount).toLocaleString()} AZN</span>
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
                      Term: <span>{term} months</span>
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
                    <span>Interest rate</span>
                    <strong className={dynamicRate === 9.9 ? 'loans-page__rate--min' : ''}>
                      {dynamicRate}% yearly
                    </strong>
                  </div>
                  <div className="loans-page__summary-row">
                    <span>Overpayment</span>
                    <strong>{Number(overpayment).toLocaleString()} AZN</strong>
                  </div>

                  <div className="loans-page__summary-total">
                    <span>Monthly payment</span>
                    <strong>{Math.floor(Number(monthlyPayment)).toLocaleString()} AZN</strong>
                  </div>
                  
                  <button 
                    className="loans-page__button loans-page__button--primary loans-page__button--full"
                    onClick={handleOpenModal}
                  >
                    Continue application
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div className="loans-page__steps" aria-label="Loan application steps">
            {processSteps.map((step) => (
              <article className="loans-page__step" key={step.title}>
                <strong>{step.number}</strong>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
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
                <h3>Select Receiving Card</h3>
                <p>Choose a card where your {Number(amount).toLocaleString()} AZN loan will be disbursed.</p>
                <div className="loans-page__cards">
                  {mockCards.map(card => (
                    <div 
                      key={card.id} 
                      className={`loans-page__card ${modalState.selectedCardId === card.id ? 'active' : ''}`}
                      onClick={() => setModalState(prev => ({ ...prev, selectedCardId: card.id }))}
                    >
                      <div className="loans-page__card-info">
                        <strong>{card.type} {card.number}</strong>
                        <span>Current balance: {card.balance.toLocaleString()} AZN</span>
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
                >
                  Confirm & Receive Funds
                </button>
              </div>
            )}

            {modalState.step === 'processing' && (
              <div className="loans-page__modal-content loans-page__modal-content--center">
                <div className="loans-page__spinner"></div>
                <h3>Processing...</h3>
                <p>Please wait while we process your loan application.</p>
              </div>
            )}

            {modalState.step === 'success' && (
              <div className="loans-page__modal-content loans-page__modal-content--center">
                <div className="loans-page__success-icon">✓</div>
                <h3>Success!</h3>
                <p>Your loan of <strong>{Number(amount).toLocaleString()} AZN</strong> has been approved at {dynamicRate}% APY and funds have been transferred to your card.</p>
                <button 
                  className="loans-page__button loans-page__button--primary loans-page__button--full" 
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

export default Loans
