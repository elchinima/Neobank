import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicFooter from '../../components/PublicFooter/PublicFooter'
import logoMark from '../../assets/logo/main_logo.png'
import loansBanner from '../../assets/images/loans_banner_az.png'
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
  const [selected, setSelected] = useState('personal')
  const [amount, setAmount] = useState(10000)
  const [term, setTerm] = useState(24)

  const selectedLoan = loanTypes.find((loanType) => loanType.id === selected)
  const monthlyRate = selectedLoan.rate / 100 / 12
  const monthlyPayment = (
    (amount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -term))
  ).toFixed(2)
  const total = (Number(monthlyPayment) * term).toFixed(2)
  const overpayment = (Number(total) - amount).toFixed(2)

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
          <Link to="/#support">Support</Link>
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

          <div className="loans-page__workspace">
            <article className="loans-page__panel loans-page__panel--calculator">
              <div className="loans-page__panel-header">
                <span>Calculator</span>
                <h3>Loan parameters</h3>
              </div>

              <div className="loans-page__form">
                <div className="loans-page__group">
                  <label>Loan type</label>
                  <div className="loans-page__types">
                    {loanTypes.map((loanType) => (
                      <button
                        type="button"
                        key={loanType.id}
                        className={`loans-page__type ${selected === loanType.id ? 'selected' : ''}`}
                        onClick={() => setSelected(loanType.id)}
                      >
                        <strong>{loanType.rate}%</strong>
                        <span>{loanType.title}</span>
                        <small>{loanType.limit}</small>
                        <p>{loanType.text}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="loans-page__group">
                  <label htmlFor="loan-amount">
                    Amount: {Number(amount).toLocaleString()} AZN
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
                  <label htmlFor="loan-term">Term: {term} months</label>
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

                <div className="loans-page__group">
                  <label htmlFor="loan-income">Monthly income</label>
                  <select id="loan-income">
                    <option>2,000 - 3,000 AZN</option>
                    <option>3,000 - 5,000 AZN</option>
                    <option>5,000+ AZN</option>
                  </select>
                </div>

                <Link to="/loans/apply" className="loans-page__button loans-page__button--primary">
                  Continue application
                </Link>
              </div>
            </article>

            <aside className="loans-page__panel loans-page__panel--summary" aria-label="Loan calculation">
              <div className="loans-page__panel-header">
                <span>Estimate</span>
                <h3>Monthly payment</h3>
              </div>

              <div className="loans-page__summary-row">
                <span>Loan type</span>
                <strong>{selectedLoan.title}</strong>
              </div>
              <div className="loans-page__summary-row">
                <span>Amount</span>
                <strong>{Number(amount).toLocaleString()} AZN</strong>
              </div>
              <div className="loans-page__summary-row">
                <span>Interest rate</span>
                <strong>{selectedLoan.rate}% yearly</strong>
              </div>
              <div className="loans-page__summary-row">
                <span>Term</span>
                <strong>{term} months</strong>
              </div>
              <div className="loans-page__summary-row">
                <span>Overpayment</span>
                <strong>{Number(overpayment).toLocaleString()} AZN</strong>
              </div>

              <div className="loans-page__summary-total">
                <span>Estimated monthly payment</span>
                <strong>{Number(monthlyPayment).toLocaleString()} AZN</strong>
              </div>
            </aside>
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
    </div>
  )
}

export default Loans
