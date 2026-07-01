import { usePublicFooter } from './PublicFooter.js'
import { Link } from 'react-router-dom'
import appPreviewImage from '../../assets/images/image_1.png'
import controlBubbleIcon from '../../assets/icons/Public/control_bubble.svg'
import newsBubbleIcon from '../../assets/icons/Public/news_bubble.svg'
import notificationBubbleIcon from '../../assets/icons/Public/notification_bubble.svg'
import './PublicFooter.scss'
import './PublicFooter_Responsive.scss'

const contactItems = [
  {
    label: 'Address',
    value: 'Baku, Azerbaijan',
    href: 'https://maps.google.com/?q=Baku%2C%20Azerbaijan',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
        <path d="M12 12.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      </svg>
    ),
  },
  {
    label: 'Mail us',
    value: 'support@neobank.az',
    href: 'mailto:support@neobank.az',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    value: '+994 12 555 45 45',
    href: 'tel:+994125554545',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.4 4.8 9.2 9l-2 1.2c1.2 2.5 3.1 4.4 5.6 5.6l1.2-2 4.2 1.8-.7 3.4c-.1.6-.7 1-1.3 1C9.4 20 4 14.6 4 7.8c0-.6.4-1.2 1-1.3l2.4-.7Z" />
      </svg>
    ),
  },
]

const productLinks = [
  { label: 'Cards', to: '/cards' },
  { label: 'Loans', to: '/loans' },
  { label: 'Deposits', to: '/deposits' },
  { label: 'Cashback', to: '/cashback' },
]

const infoLinks = [
  { label: 'Home', to: '/' },
  { label: 'Sign in', to: '/login' },
  { label: 'Open account', to: '/register' },
  { label: 'Support', to: '/#support' },
]

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8.6h2V5.2c-.9-.1-1.8-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.6v2.6H6v3.8h2.8V24h3.8v-8h3.1l.5-3.8h-3.6V10c0-.9.2-1.4 1.4-1.4Z" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.9 3h3.2l-7 8 8.2 10h-6.4l-5-6.2L6.1 21H2.9l7.5-8.6L2.5 3h6.6l4.5 5.5L18.9 3Zm-1.1 16.2h1.8L8.1 4.7H6.2l11.6 14.5Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.3 8.8H1.7V21h3.6V8.8ZM3.5 3A2.1 2.1 0 1 0 3.5 7.2 2.1 2.1 0 0 0 3.5 3ZM22.3 14.2c0-3.7-2-5.7-4.8-5.7-2.2 0-3.2 1.2-3.7 2.1V8.8h-3.6V21h3.6v-6.8c0-1.8.9-2.8 2.4-2.8 1.4 0 2.3 1 2.3 2.8V21h3.8v-6.8Z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Z" />
        <path d="M12 7.3A4.7 4.7 0 1 1 12 16.7 4.7 4.7 0 0 1 12 7.3Zm0 2A2.7 2.7 0 1 0 12 14.7 2.7 2.7 0 0 0 12 9.3Z" />
        <path d="M17.5 6.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" />
      </svg>
    ),
  },
]

const storeLinks = [
  {
    label: 'Google Play',
    eyebrow: 'GET IT ON',
    title: 'Google Play',
    href: 'https://play.google.com/store',
    icon: (
      <svg className="public-footer__store-icon public-footer__store-icon--play" viewBox="0 0 24 24" aria-hidden="true">
        <path className="public-footer__play-part public-footer__play-part--blue" d="M4.1 3.4c-.7.5-1.1 1.3-1.1 2.3v12.6c0 1 .4 1.8 1.1 2.3l8.7-8.6-8.7-8.6Z" />
        <path className="public-footer__play-part public-footer__play-part--green" d="M12.8 12 16 8.8 6 2.9c-.7-.4-1.4-.3-1.9.1l8.7 9Z" />
        <path className="public-footer__play-part public-footer__play-part--yellow" d="m16 8.8-3.2 3.2 3.2 3.2 3.2-1.9c1.1-.7 1.1-2 0-2.6L16 8.8Z" />
        <path className="public-footer__play-part public-footer__play-part--red" d="M12.8 12 4.1 21c.5.4 1.2.5 1.9.1l10-5.9-3.2-3.2Z" />
      </svg>
    ),
  },
  {
    label: 'App Store',
    eyebrow: 'Download on the',
    title: 'App Store',
    href: 'https://www.apple.com/app-store/',
    icon: (
      <svg className="public-footer__store-icon public-footer__store-icon--apple" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.6 12.8c0-2.2 1.8-3.3 1.9-3.4-1.1-1.5-2.7-1.8-3.2-1.8-1.4-.1-2.6.8-3.3.8s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.8 1.1 9.1.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.6 0-.1-2.8-1.1-2.8-3.6Z" />
        <path d="M14.4 6.1c.6-.8 1.1-1.8 1-2.9-1 0-2.1.7-2.8 1.4-.6.7-1.1 1.8-1 2.8 1.1.1 2.1-.5 2.8-1.3Z" />
      </svg>
    ),
  },
]

const appFeatures = [
  {
    title: 'Track actions',
    text: 'See payments, transfers and cashback in one place.',
  },
  {
    title: 'Control cards',
    text: 'Freeze cards and check limits anytime.',
  },
  {
    title: 'Stay updated',
    text: 'Follow deposits, loans and support updates faster.',
  },
]

const floatingIcons = [
  { label: 'Notifications', src: notificationBubbleIcon, modifier: 'notification' },
  { label: 'Controls', src: controlBubbleIcon, modifier: 'control' },
  { label: 'News', src: newsBubbleIcon, modifier: 'news' },
]

function PublicFooter() {
  const {
    isInfoOpen,
    setIsInfoOpen,
    scrollToTop,
  } = usePublicFooter()

  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <section className="public-footer__account" aria-labelledby="footer-account-title">
          <h2 id="footer-account-title">Contact Us</h2>
          <ul className="public-footer__contact-list">
            {contactItems.map((item) => (
              <li key={item.label}>
                <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  <span className="public-footer__icon">{item.icon}</span>
                  <span>
                    <strong>{item.label}:</strong> {item.value}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <nav className="public-footer__links" aria-labelledby="footer-products-title">
          <h2 id="footer-products-title">Products</h2>
          {productLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <nav className="public-footer__links" aria-labelledby="footer-info-title">
          <h2 id="footer-info-title">Information</h2>
          {infoLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <section className="public-footer__subscribe" aria-labelledby="footer-subscribe-title">
          <h2 id="footer-subscribe-title">Subscribe</h2>
          <form
            className="public-footer__form"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <label className="public-footer__sr-only" htmlFor="footer-email">
              Email address
            </label>
            <input id="footer-email" type="email" placeholder="Email address" />
            <button type="submit">Subscribe</button>
          </form>
        </section>
      </div>

      <div className="public-footer__bottom">
        <p>
          Copyright 2026 <span>NeoBank</span>. All Rights Reserved
        </p>

        <div className="public-footer__stores" aria-label="Mobile app links">
          {storeLinks.map((link) => (
            <a
              className={`public-footer__store-badge public-footer__store-badge--${link.label === 'Google Play' ? 'play' : 'apple'}`}
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
            >
              {link.icon}
              <span>
                <small>{link.eyebrow}</small>
                <strong>{link.title}</strong>
              </span>
            </a>
          ))}
          <button className="public-footer__info" type="button" aria-label="More information" onClick={() => setIsInfoOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Z" />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </div>

        <div className="public-footer__socials" aria-label="Social links">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
              {link.icon}
            </a>
          ))}
        </div>
      </div>

      <button className="public-footer__to-top" type="button" aria-label="Scroll to top" onClick={scrollToTop}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 14 6-6 6 6" />
        </svg>
      </button>

      {isInfoOpen && (
        <div className="public-footer__modal-backdrop" role="presentation" onMouseDown={() => setIsInfoOpen(false)}>
          <section
            className="public-footer__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-info-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="public-footer__modal-close" type="button" aria-label="Close app information" onClick={() => setIsInfoOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12" />
                <path d="M18 6 6 18" />
              </svg>
            </button>

            <div className="public-footer__modal-media">
              <img src={appPreviewImage} alt="NeoBank mobile app preview" />
              <div className="public-footer__floating-icons" aria-hidden="true">
                {floatingIcons.map((icon) => (
                  <span
                    className={`public-footer__floating-icon public-footer__floating-icon--${icon.modifier}`}
                    key={icon.label}
                  >
                    <img src={icon.src} alt="" />
                  </span>
                ))}
              </div>
            </div>

            <div className="public-footer__modal-content">
              <p className="public-footer__modal-eyebrow">NeoBank mobile</p>
              <h2 id="app-info-title">Download the app and track your actions with comfort.</h2>
              <p>
                Manage daily banking in one place: monitor balances, card activity,
                cashback, deposits and support updates with a calmer mobile experience.
              </p>

              <div className="public-footer__modal-features">
                {appFeatures.map((feature) => (
                  <article key={feature.title}>
                    <strong>{feature.title}</strong>
                    <span>{feature.text}</span>
                  </article>
                ))}
              </div>

              <div className="public-footer__modal-stores" aria-label="Download NeoBank app">
                {storeLinks.map((link) => (
                  <a
                    className={`public-footer__store-badge public-footer__store-badge--${link.label === 'Google Play' ? 'play' : 'apple'}`}
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.label}
                  >
                    {link.icon}
                    <span>
                      <small>{link.eyebrow}</small>
                      <strong>{link.title}</strong>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </footer>
  )
}

export default PublicFooter
