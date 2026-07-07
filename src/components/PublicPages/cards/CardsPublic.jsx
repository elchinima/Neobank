import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicFooter from '../../../components/PublicFooter/PublicFooter'
import logoMark from '../../../assets/logo/main_logo.png'
import cardsBanner from '../../../assets/images/card_banner_az.png'
import standartVisa from '../../../assets/images/standart_card_visa.png'
import standartMc from '../../../assets/images/standart_card_mc.png'
import premiumVisa from '../../../assets/images/premium_card_visa.png'
import premiumMc from '../../../assets/images/premium_card_mc.png'
import eliteVisa from '../../../assets/images/elite_card_visa.png'
import eliteMc from '../../../assets/images/elite_card_mc.png'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { usePublicPageSetting } from '../../../app/hooks/usePublicContent'
import NavUserProfile from '../../NavUserProfile/NavUserProfile'
import { cardsLang } from './lang.js'
import './CardsPublic.scss'
import './CardsPublic_Responsive.scss'

function CardsPublic() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const { setting } = usePublicPageSetting('cards')
  const navigate = useNavigate()
  const bannerImage = setting?.bannerImageUrl ?? cardsBanner
  const hasBanner = bannerImage !== ''

  const cardProducts = [
    {
      id: 'standard',
      type: 'Standard',
      eyebrowKey: 'card0Eyebrow',
      titleKey: 'card0Title',
      textKey: 'card0Text',
      featureKey: 'card0Feature',
      serviceKey: 'card0Service',
      visa: standartVisa,
      mastercard: standartMc,
    },
    {
      id: 'elite',
      type: 'Elite',
      eyebrowKey: 'card1Eyebrow',
      titleKey: 'card1Title',
      textKey: 'card1Text',
      featureKey: 'card1Feature',
      serviceKey: 'card1Service',
      visa: eliteVisa,
      mastercard: eliteMc,
    },
    {
      id: 'premium',
      type: 'Premium',
      eyebrowKey: 'card2Eyebrow',
      titleKey: 'card2Title',
      textKey: 'card2Text',
      featureKey: 'card2Feature',
      serviceKey: 'card2Service',
      visa: premiumVisa,
      mastercard: premiumMc,
    },
  ]

  const stats = [
    { labelKey: 'stat0Label', value: '2 min', subKey: 'stat0Sub' },
    { labelKey: 'stat1Label', value: 'Visa / MC', subKey: 'stat1Sub', mobileOnly: true },
    { labelKey: 'stat2Label', value: '100%', subKey: 'stat2Sub' },
    { labelKey: 'stat3Label', value: '24/7', subKey: 'stat3Sub' },
  ]

  const [selectedNetworks, setSelectedNetworks] = useState(
    cardProducts.reduce((networks, card) => ({ ...networks, [card.id]: 'visa' }), {})
  )

  const setCardNetwork = (cardId, network) => {
    setSelectedNetworks((current) => ({ ...current, [cardId]: network }))
  }

  const handleOrderCard = (cardType) => {
    if (!isAuthenticated) {
      navigate('/login')
    } else {
      navigate('/user/cards', { state: { orderCardType: cardType } })
    }
  }

  return (
    <div className="cards-page">
      <nav className="cards-page__nav" aria-label="Cards navigation">
        <Link className="cards-page__brand" to="/" aria-label="NeoBank home">
          <span className="cards-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="NeoBank logo" />
          </span>
          <span className="cards-page__brand-name">NeoBank</span>
        </Link>

        <div className="cards-page__nav-links">
          <Link to="/" data-lang-key="navHome">{t(cardsLang, 'navHome')}</Link>
          <Link to="/loans" data-lang-key="navLoans">{t(cardsLang, 'navLoans')}</Link>
          <Link to="/deposits" data-lang-key="navDeposits">{t(cardsLang, 'navDeposits')}</Link>
          <Link to="/cashback" data-lang-key="navCashback">{t(cardsLang, 'navCashback')}</Link>
          <Link to="/support" data-lang-key="navSupport">{t(cardsLang, 'navSupport')}</Link>
        </div>

        <div className="cards-page__nav-actions">
          {isAuthenticated && user ? (
            <NavUserProfile />
          ) : (
            <>
              <Link to="/login" className="cards-page__button cards-page__button--ghost" data-lang-key="signIn">
                {t(cardsLang, 'signIn')}
              </Link>
              <Link to="/register" className="cards-page__button cards-page__button--primary" data-lang-key="openAccount">
                {t(cardsLang, 'openAccount')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="cards-page__main">
        <section className={`cards-page__hero${hasBanner ? '' : ' cards-page__hero--no-media'}`} aria-labelledby="cards-title">
          <div className="cards-page__hero-content">
            <p className="cards-page__eyebrow" data-lang-key="heroEyebrow">{t(cardsLang, 'heroEyebrow')}</p>
            <h1 id="cards-title" data-lang-key="heroTitle">{t(cardsLang, 'heroTitle')}</h1>

            <div className="cards-page__hero-actions">
              <a className="cards-page__button cards-page__button--primary" href="#card-lineup" data-lang-key="compareCards">
                {t(cardsLang, 'compareCards')}
              </a>
              <button
                className="cards-page__button cards-page__button--light"
                onClick={() => handleOrderCard('Standard')}
                data-lang-key="orderCard"
              >
                {t(cardsLang, 'orderCard')}
              </button>
            </div>

            {hasBanner && (
              <div className="cards-page__hero-stats" aria-label="Card overview">
                {stats.map((stat) => (
                  <div
                    className={`cards-page__hero-stat${stat.mobileOnly ? ' cards-page__hero-stat--mobile-only' : ''}`}
                    key={stat.labelKey}
                  >
                    <span data-lang-key={stat.labelKey}>{t(cardsLang, stat.labelKey)}</span>
                    <strong>{stat.value}</strong>
                    <small data-lang-key={stat.subKey}>{t(cardsLang, stat.subKey)}</small>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasBanner && (
            <div className="cards-page__hero-media" aria-label="NeoBank card campaign">
              <img src={bannerImage} alt="NeoBank card campaign" />
              <p className="cards-page__media-copy" data-lang-key="mediaCopy">
                {setting?.mediaText || t(cardsLang, 'mediaCopy')}
              </p>
            </div>
          )}
        </section>

        <section className="cards-page__lineup" id="card-lineup" aria-labelledby="card-lineup-title">
          <div className="cards-page__lineup-heading">
            <p className="cards-page__eyebrow" data-lang-key="lineupEyebrow">{t(cardsLang, 'lineupEyebrow')}</p>
            <h2 id="card-lineup-title" data-lang-key="lineupTitle">{t(cardsLang, 'lineupTitle')}</h2>
            <p data-lang-key="lineupDesc">
              {t(cardsLang, 'lineupDesc')}
            </p>
          </div>

          <div className="cards-page__showcases">
            {cardProducts.map((card, index) => (
              <article
                className={`cards-page__showcase${index % 2 === 1 ? ' cards-page__showcase--reverse' : ''}`}
                key={card.id}
              >
                <div className="cards-page__card-preview" aria-label="Network preview">
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
                      alt="Card"
                    />
                    <figcaption>{selectedNetworks[card.id] === 'visa' ? 'Visa' : 'Mastercard'}</figcaption>
                  </figure>
                </div>

                <div className="cards-page__showcase-copy">
                  <p className="cards-page__eyebrow" data-lang-key={card.eyebrowKey}>{t(cardsLang, card.eyebrowKey)}</p>
                  <h3 data-lang-key={card.titleKey}>{t(cardsLang, card.titleKey)}</h3>
                  <p data-lang-key={card.textKey}>{t(cardsLang, card.textKey)}</p>

                  <div className="cards-page__feature-grid" aria-label="Highlights">
                    <div>
                      <span data-lang-key="specialFeature">{t(cardsLang, 'specialFeature')}</span>
                      <strong data-lang-key={card.featureKey}>{t(cardsLang, card.featureKey)}</strong>
                    </div>
                    <div>
                      <span data-lang-key="service">{t(cardsLang, 'service')}</span>
                      <strong data-lang-key={card.serviceKey}>{t(cardsLang, card.serviceKey)}</strong>
                    </div>
                  </div>

                  <div className="cards-page__showcase-actions">
                    <button
                      type="button"
                      onClick={() => handleOrderCard(card.type)}
                      className="cards-page__button cards-page__button--primary"
                      data-lang-key="orderThisCard"
                    >
                      {t(cardsLang, 'orderThisCard')}
                    </button>
                    <Link to="/cards" className="cards-page__button cards-page__button--light" data-lang-key="cardDetails">
                      {t(cardsLang, 'cardDetails')}
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
