import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import cashbackBanner from '../../../assets/images/cashback_banner_az.png'
import './Cashback.scss'
import './Cashback_Responsive.scss'

const categoryProgram = [
  {
    title: 'Every 5th metro or bus ride',
    rate: '100%',
    text: 'Calculated from the average fare across all five rides.',
  },
  {
    title: 'Supermarkets',
    rate: '5%',
    text: 'Everyday grocery spending earns the highest retail rate.',
  },
  {
    title: 'Pharmacies',
    rate: '3%',
    text: 'Health and pharmacy purchases are included automatically.',
  },
  {
    title: 'Fuel stations',
    rate: '3%',
    text: 'Cashback for regular car expenses and fuel payments.',
  },
  {
    title: 'Restaurants, cafes, sweets',
    rate: '2%',
    text: 'Dining, coffee, desserts, and similar food categories.',
  },
  {
    title: 'Clothing and shoes',
    rate: '2%',
    text: 'Fashion, footwear, and wardrobe essentials.',
  },
  {
    title: 'Trendyol and Temu',
    rate: '1%',
    text: 'Online marketplace purchases through popular platforms.',
  },
  {
    title: 'Other payments',
    rate: '0.1%',
    text: 'A base reward for payments outside the main categories.',
  },
]

const simpleProgram = [
  {
    title: 'Every 5th metro or bus ride',
    rate: '100%',
    text: 'The transit bonus stays active in the simplified plan.',
  },
  {
    title: 'All payments',
    rate: '1%',
    text: 'One clean cashback rate for every eligible purchase.',
  },
]

const cashbackNotes = [
  'Maximum cashback limit is 350 AZN per month.',
  'The 5th transit ride cashback is calculated from the average price of all five rides.',
]

function Cashback() {
  return (
    <div className="cashback-page">
      <nav className="cashback-page__nav" aria-label="Cashback navigation">
        <Link className="cashback-page__brand" to="/" aria-label="NeoBank home">
          <span className="cashback-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="cashback-page__brand-name">NeoBank</span>
        </Link>

        <div className="cashback-page__nav-links">
          <Link to="/">Home</Link>
          <Link to="/cards">Cards</Link>
          <Link to="/loans">Loans</Link>
          <Link to="/deposits">Deposits</Link>
          <Link to="/support">Support</Link>
        </div>

        <div className="cashback-page__nav-actions">
          <Link to="/login" className="cashback-page__button cashback-page__button--ghost">
            Sign in
          </Link>
          <Link to="/register" className="cashback-page__button cashback-page__button--primary">
            Open account
          </Link>
        </div>
      </nav>

      <main className="cashback-page__main">
        <section className="cashback-page__hero" aria-labelledby="cashback-title">
          <div className="cashback-page__hero-content">
            <p className="cashback-page__eyebrow">NeoBank Cashback</p>
            <h1 id="cashback-title">Get more back from everyday spending.</h1>

            <div className="cashback-page__hero-actions">
              <Link to="/register" className="cashback-page__button cashback-page__button--primary">
                Start earning
              </Link>
              <Link to="/login" className="cashback-page__button cashback-page__button--light">
                View my cashback
              </Link>
            </div>
          </div>

          <div className="cashback-page__hero-media" aria-hidden="true">
            <img src={cashbackBanner} alt="" />
            <p className="cashback-page__media-copy">
              Earn automatic cashback at supermarkets, fuel stations, and pharmacies.
              Spend as usual, track rewards in NeoBank, and move earned cashback back
              to your account when it is ready.
            </p>
          </div>
        </section>

        <section className="cashback-page__plans" aria-labelledby="cashback-plans-title">
          <div className="cashback-page__plans-heading">
            <p className="cashback-page__eyebrow">Cashback options</p>
            <h2 id="cashback-plans-title">Choose how rewards should work.</h2>
            <p>
              NeoBank can support a category-based cashback model or a simpler
              universal model. Both include the special public transport reward.
            </p>
          </div>

          <div className="cashback-page__plans-grid">
            <article className="cashback-page__plan cashback-page__plan--featured">
              <div className="cashback-page__plan-header">
                <span>Option A</span>
                <h3>Category rewards</h3>
              </div>

              <div className="cashback-page__offers">
                {categoryProgram.map((item) => (
                  <div className="cashback-page__offer" key={item.title}>
                    <strong>{item.rate}</strong>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <div className="cashback-page__or" aria-hidden="true">
              <span>or</span>
            </div>

            <article className="cashback-page__plan">
              <div className="cashback-page__plan-header">
                <span>Option B</span>
                <h3>Simple rewards</h3>
              </div>

              <div className="cashback-page__offers">
                {simpleProgram.map((item) => (
                  <div className="cashback-page__offer" key={item.title}>
                    <strong>{item.rate}</strong>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="cashback-page__notes" aria-label="Cashback notes">
            {cashbackNotes.map((note, index) => (
              <div className="cashback-page__note" key={note}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <p>{note}</p>
              </div>
            ))}
          </aside>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

export default Cashback
