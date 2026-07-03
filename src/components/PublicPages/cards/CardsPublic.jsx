import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import cardsBanner from '../../../assets/images/card_banner_az.png'
import standartVisa from '../../../assets/images/standart_card_visa.png'
import standartMc from '../../../assets/images/standart_card_mc.png'
import premiumVisa from '../../../assets/images/premium_card_visa.png'
import premiumMc from '../../../assets/images/premium_card_mc.png'
import eliteVisa from '../../../assets/images/elite_card_visa.png'
import eliteMc from '../../../assets/images/elite_card_mc.png'
import './CardsPublic.scss'
import './CardsPublic_Responsive.scss'

const stats = [
  { label: 'Issue time', value: '2 min', sub: 'digital card' },
  { label: 'Networks', value: 'Visa / MC', sub: 'choose anytime', mobileOnly: true },
  { label: 'Cashback', value: '100%', sub: 'selected categories' },
  { label: 'Controls', value: '24/7', sub: 'freeze and settings' },
]

const cardProducts = [
  {
    id: 'standard',
    eyebrow: 'Everyday card',
    title: 'Standard keeps daily spending clear.',
    text: 'A practical card for salary, transfers, online payments, and regular shopping with simple controls in NeoBank.',
    feature: '100% cashback',
    service: '0 AZN monthly',
    visa: standartVisa,
    mastercard: standartMc,
  },
  {
    id: 'elite',
    eyebrow: 'Priority banking',
    title: 'Elite gives your main card room to move.',
    text: 'For larger purchases and priority customers: priority privileges, premium support, and stronger everyday payment control.',
    feature: '2x VAT return',
    service: '9 AZN monthly',
    visa: eliteVisa,
    mastercard: eliteMc,
  },
  {
    id: 'premium',
    eyebrow: 'Travel and lifestyle',
    title: 'Premium adds richer comfort and flexible benefits.',
    text: 'Built for active spending: travel-ready payments, VIP services, and card settings you can adjust before checkout.',
    feature: 'VIP services',
    service: '19 AZN monthly',
    visa: premiumVisa,
    mastercard: premiumMc,
  },
]

function CardsPublic() {
  const [selectedNetworks, setSelectedNetworks] = useState(
    cardProducts.reduce((networks, card) => ({ ...networks, [card.id]: 'visa' }), {})
  )

  const setCardNetwork = (cardId, network) => {
    setSelectedNetworks((current) => ({ ...current, [cardId]: network }))
  }

  return (
    <div className="cards-page">
      <nav className="cards-page__nav" aria-label="Cards navigation">
        <Link className="cards-page__brand" to="/" aria-label="NeoBank home">
          <span className="cards-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="cards-page__brand-name">NeoBank</span>
        </Link>

        <div className="cards-page__nav-links">
          <Link to="/">Home</Link>
          <Link to="/loans">Loans</Link>
          <Link to="/deposits">Deposits</Link>
          <Link to="/cashback">Cashback</Link>
          <Link to="/support">Support</Link>
        </div>

        <div className="cards-page__nav-actions">
          <Link to="/login" className="cards-page__button cards-page__button--ghost">
            Sign in
          </Link>
          <Link to="/register" className="cards-page__button cards-page__button--primary">
            Open account
          </Link>
        </div>
      </nav>

      <main className="cards-page__main">
        <section className="cards-page__hero" aria-labelledby="cards-title">
          <div className="cards-page__hero-content">
            <p className="cards-page__eyebrow">NeoBank Cards</p>
            <h1 id="cards-title">Choose the card that fits how you spend.</h1>

            <div className="cards-page__hero-actions">
              <a className="cards-page__button cards-page__button--primary" href="#card-lineup">
                Compare cards
              </a>
              <Link to="/register" className="cards-page__button cards-page__button--light">
                Order a card
              </Link>
            </div>

            <div className="cards-page__hero-stats" aria-label="Card overview">
              {stats.map((stat) => (
                <div
                  className={`cards-page__hero-stat${stat.mobileOnly ? ' cards-page__hero-stat--mobile-only' : ''}`}
                  key={stat.label}
                >
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.sub}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="cards-page__hero-media" aria-label="NeoBank card campaign">
            <img src={cardsBanner} alt="NeoBank card campaign" />
            <p className="cards-page__media-copy">
              Issue Visa or Mastercard, manage settings, track activity, and keep card control
              close to every payment.
            </p>
          </div>
        </section>

        <section className="cards-page__lineup" id="card-lineup" aria-labelledby="card-lineup-title">
          <div className="cards-page__lineup-heading">
            <p className="cards-page__eyebrow">Card lineup</p>
            <h2 id="card-lineup-title">Visa first, Mastercard one swipe away.</h2>
            <p>
              Each card starts with the Visa design. Switch the network control to
              compare the Mastercard version without leaving the offer.
            </p>
          </div>

          <div className="cards-page__showcases">
            {cardProducts.map((card, index) => (
              <article
                className={`cards-page__showcase${index % 2 === 1 ? ' cards-page__showcase--reverse' : ''}`}
                key={card.id}
              >
                <div className="cards-page__card-preview" aria-label={`${card.title} network preview`}>
                  <div className="cards-page__network-switch" aria-label="Choose card network">
                    <button
                      type="button"
                      className={selectedNetworks[card.id] === 'visa' ? 'active' : ''}
                      onClick={() => setCardNetwork(card.id, 'visa')}
                    >
                      Visa
                    </button>
                    <button
                      type="button"
                      className={selectedNetworks[card.id] === 'mastercard' ? 'active' : ''}
                      onClick={() => setCardNetwork(card.id, 'mastercard')}
                    >
                      Mastercard
                    </button>
                  </div>

                  <figure
                    className="cards-page__card-figure"
                    key={`${card.id}-${selectedNetworks[card.id]}`}
                  >
                    <img
                      src={selectedNetworks[card.id] === 'visa' ? card.visa : card.mastercard}
                      alt={`${card.title} ${selectedNetworks[card.id] === 'visa' ? 'Visa' : 'Mastercard'} card`}
                    />
                    <figcaption>{selectedNetworks[card.id] === 'visa' ? 'Visa' : 'Mastercard'}</figcaption>
                  </figure>
                </div>

                <div className="cards-page__showcase-copy">
                  <p className="cards-page__eyebrow">{card.eyebrow}</p>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>

                  <div className="cards-page__feature-grid" aria-label={`${card.title} highlights`}>
                    <div>
                      <span>Special feature</span>
                      <strong>{card.feature}</strong>
                    </div>
                    <div>
                      <span>Service</span>
                      <strong>{card.service}</strong>
                    </div>
                  </div>

                  <div className="cards-page__showcase-actions">
                    <Link to="/register" className="cards-page__button cards-page__button--primary">
                      Order this card
                    </Link>
                    <Link to="/cards" className="cards-page__button cards-page__button--light">
                      Card details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}

export default CardsPublic
