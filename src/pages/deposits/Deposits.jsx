import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicFooter from '../../components/PublicFooter/PublicFooter'
import logoMark from '../../assets/logo/main_logo.png'
import depositsBanner from '../../assets/images/deposits_banner_az.png'
import './Deposits.scss'
import './Deposits_Responsive.scss'

const depositTypes = [
  { id: 'term', icon: 'T', name: 'Term', rate: 7.5, caption: 'Fixed return for planned goals' },
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
  const [selected, setSelected] = useState('term')
  const [amount, setAmount] = useState(1000)
  const [term, setTerm] = useState(12)

  const selectedType = depositTypes.find((depositType) => depositType.id === selected)
  const income = (amount * (selectedType.rate / 100) * (term / 12)).toFixed(2)
  const total = (Number(amount) + Number(income)).toFixed(2)

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
              <div className="deposits-page__carousel-dots" aria-hidden="true">
                <span className="active" />
                <span />
                <span />
              </div>
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
            <p className="deposits-page__eyebrow">Open a deposit</p>
            <h2 id="deposit-plans-title">Choose the plan, then tune the numbers.</h2>
            <p>
              Customers can choose a deposit type, review the projected return, and
              create a new plan without switching pages.
            </p>
          </div>

          <div className="deposits-page__workspace">
            <article className="deposits-page__panel deposits-page__panel--calculator">
              <div className="deposits-page__panel-header">
                <span>Calculator</span>
                <h3>Deposit parameters</h3>
              </div>

              <div className="deposits-page__form">
                <div className="deposits-page__group">
                  <label>Deposit type</label>
                  <div className="deposits-page__types">
                    {depositTypes.map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        className={`deposits-page__type ${selected === type.id ? 'selected' : ''}`}
                        onClick={() => setSelected(type.id)}
                      >
                        <strong>{type.rate}%</strong>
                        <span>{type.name}</span>
                        <p>{type.caption}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="deposits-page__group">
                  <label htmlFor="deposit-amount">
                    Amount: {Number(amount).toLocaleString()} AZN
                  </label>
                  <input
                    id="deposit-amount"
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                  />
                </div>

                <div className="deposits-page__group">
                  <label htmlFor="deposit-term">Term: {term} months</label>
                  <input
                    id="deposit-term"
                    type="range"
                    min="1"
                    max="36"
                    step="1"
                    value={term}
                    onChange={(event) => setTerm(Number(event.target.value))}
                  />
                </div>

                <div className="deposits-page__group">
                  <label htmlFor="deposit-source">Funding account</label>
                  <select id="deposit-source">
                    <option>Current account - 12,450.00 AZN</option>
                    <option>Savings account - 8,000.00 AZN</option>
                  </select>
                </div>

                <button className="deposits-page__button deposits-page__button--primary" type="button">
                  Open deposit
                </button>
              </div>
            </article>

            <aside className="deposits-page__panel deposits-page__panel--summary" aria-label="Deposit calculation">
              <div className="deposits-page__panel-header">
                <span>Projection</span>
                <h3>Expected return</h3>
              </div>

              <div className="deposits-page__summary-row">
                <span>Deposit type</span>
                <strong>{selectedType.name}</strong>
              </div>
              <div className="deposits-page__summary-row">
                <span>Amount</span>
                <strong>{Number(amount).toLocaleString()} AZN</strong>
              </div>
              <div className="deposits-page__summary-row">
                <span>Interest rate</span>
                <strong>{selectedType.rate}% yearly</strong>
              </div>
              <div className="deposits-page__summary-row">
                <span>Term</span>
                <strong>{term} months</strong>
              </div>
              <div className="deposits-page__summary-row">
                <span>Income</span>
                <strong>{income} AZN</strong>
              </div>

              <div className="deposits-page__summary-total">
                <span>Total at maturity</span>
                <strong>{Number(total).toLocaleString()} AZN</strong>
              </div>
            </aside>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}

export default Deposits
