import { Link } from 'react-router-dom'
import logoMark from '../../assets/logo/main_logo.png'
import logoWithText from '../../assets/logo/main_logo_with_text.png'
import './Landing.scss'

const products = [
  {
    label: 'Accounts',
    title: 'Open and organize money in minutes',
    text: 'Create everyday, savings, and goal accounts with live balance tracking.',
  },
  {
    label: 'Cards',
    title: 'Issue cards with controls built in',
    text: 'Freeze, replace, and manage limits before a payment ever becomes a problem.',
  },
  {
    label: 'Transfers',
    title: 'Move funds without the waiting room',
    text: 'Send money between your accounts or to another NeoBank customer instantly.',
  },
  {
    label: 'Insights',
    title: 'Know where every manat is going',
    text: 'Track categories, cashbacks, subscriptions, and upcoming commitments at a glance.',
  },
]

const highlights = [
  { value: '2 min', label: 'average signup' },
  { value: '24/7', label: 'account access' },
  { value: '2FA', label: 'protected login' },
]

const securityItems = [
  'Two-factor authentication on every sensitive action',
  'Instant card freezing and limit management',
  'Support tickets tracked from request to resolution',
]

function Landing() {
  return (
    <div className="landing">
      <nav className="landing__nav" aria-label="Main navigation">
        <a className="landing__brand" href="#top" aria-label="NeoBank home">
          <span className="landing__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="landing__brand-name">NeoBank</span>
        </a>

        <div className="landing__nav-links">
          <Link to="/cards">Cards</Link>
          <Link to="/loans">Loans</Link>
          <Link to="/deposits">Deposits</Link>
          <Link to="/cashback">Cashback</Link>
          <a href="#support">Support</a>
        </div>

        <div className="landing__nav-actions">
          <Link to="/login" className="landing__button landing__button--ghost">
            Sign in
          </Link>
          <Link to="/register" className="landing__button landing__button--primary">
            Open account
          </Link>
        </div>
      </nav>

      <main id="top">
        <section className="landing__hero" aria-labelledby="landing-title">
          <div className="landing__hero-overlay" />
          <div className="landing__hero-inner">
            <p className="landing__eyebrow">Smarter banking</p>
            <h1 id="landing-title">Smarter banking. Premium glow.</h1>
            <p className="landing__hero-copy">
              A clean, secure banking workspace for accounts, cards, transfers, loans,
              deposits, cashback, and support. Designed around the NeoBank identity:
              sharp graphite surfaces, violet depth, and a confident gold finish.
            </p>

            <div className="landing__hero-actions">
              <Link to="/register" className="landing__button landing__button--primary">
                Get started
              </Link>
              <Link to="/login" className="landing__button landing__button--light">
                View dashboard
              </Link>
            </div>

            <div className="landing__hero-stats" aria-label="NeoBank highlights">
              {highlights.map((item) => (
                <div className="landing__hero-stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing__hero-logo" aria-label="NeoBank visual identity">
            <img src={logoWithText} alt="NeoBank - Smarter Banking" />
          </div>
        </section>

        <section className="landing__products" id="products">
          <div className="landing__section-heading">
            <p className="landing__eyebrow">One banking surface</p>
            <h2>Everything important stays within reach.</h2>
          </div>

          <div className="landing__products-grid">
            {products.map((product, index) => (
              <article className="landing__product-card" key={product.title}>
                <span className="landing__product-index">{String(index + 1).padStart(2, '0')}</span>
                <p>{product.label}</p>
                <h3>{product.title}</h3>
                <span>{product.text}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing__control">
          <div className="landing__control-copy">
            <p className="landing__eyebrow">Daily control</p>
            <h2>Less guessing. More knowing.</h2>
            <p>
              NeoBank keeps the operational side of money visible: balances, cards,
              deposits, loans, cashback, subscriptions, and support requests are grouped
              around the actions people actually take.
            </p>
          </div>

          <div className="landing__dashboard-preview" aria-label="Account overview preview">
            <div className="landing__preview-header">
              <span>Account overview</span>
              <strong>12,450.00 AZN</strong>
            </div>
            <div className="landing__preview-row">
              <span>Deposit progress</span>
              <strong>72%</strong>
            </div>
            <div className="landing__preview-row">
              <span>Premium card</span>
              <strong>Active</strong>
            </div>
            <div className="landing__preview-row">
              <span>Cashback this month</span>
              <strong>84.20 AZN</strong>
            </div>      
          </div>
        </section>

        <section className="landing__security" id="security">
          <div>
            <p className="landing__eyebrow">Security by default</p>
            <h2>Your money needs clear controls.</h2>
          </div>

          <ul className="landing__security-list">
            {securityItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="landing__support" id="support">
          <p className="landing__eyebrow">Ready when you are</p>
          <h2>Open your account and start banking in one place.</h2>
          <Link to="/register" className="landing__button landing__button--primary">
            Create account
          </Link>
        </section>
      </main>

      <footer className="landing__footer">
        <span>2026 NeoBank. All rights reserved.</span>
        <span>Designed by Elsim Studio</span>
      </footer>
    </div>
  )
}

export default Landing
