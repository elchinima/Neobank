import React, { useState, useRef, useEffect } from 'react'
import { usePublicFooter } from './PublicFooter.js'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../app/context/LanguageContext'
import { usePublicContent } from '../../app/hooks/usePublicContent'
import { footerLang } from './lang.js'
import logoMark from '../../assets/logo/main_logo.png'
import appPreviewImage from '../../assets/images/image_1.png'
import controlBubbleIcon from '../../assets/icons/Public/control_bubble.svg'
import newsBubbleIcon from '../../assets/icons/Public/news_bubble.svg'
import notificationBubbleIcon from '../../assets/icons/Public/notification_bubble.svg'
import userAgreementIcon from '../../assets/icons/Public/user_agreement.svg'
import rulesIcon from '../../assets/icons/Public/rules.svg'
import privacyPolicyIcon from '../../assets/icons/Public/privacy_policy.svg'
import personalDataIcon from '../../assets/icons/Public/personal_data_processing.svg'
import './PublicFooter.scss'
import './PublicFooter_Responsive.scss'

const contactItems = [
  {
    key: 'address',
    valueKey: 'addressValue',
    href: 'https://maps.google.com/?q=Baku%2C%20Azerbaijan',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
        <path d="M12 12.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      </svg>
    ),
  },
  {
    key: 'mailUs',
    valueKey: 'emailVal',
    fallbackValue: 'support@neobank.az',
    href: 'mailto:support@neobank.az',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4z" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
  {
    key: 'phone',
    valueKey: 'phoneVal',
    fallbackValue: '+994 12 555 45 45',
    href: 'tel:+994125554545',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.4 4.8 9.2 9l-2 1.2c1.2 2.5 3.1 4.4 5.6 5.6l1.2-2 4.2 1.8-.7 3.4c-.1.6-.7 1-1.3 1C9.4 20 4 14.6 4 7.8c0-.6.4-1.2 1-1.3l2.4-.7Z" />
      </svg>
    ),
  },
]

const productLinks = [
  { key: 'cards', label: 'Cards', to: '/cards' },
  { key: 'loans', label: 'Loans', to: '/loans' },
  { key: 'deposits', label: 'Deposits', to: '/deposits' },
  { key: 'cashback', label: 'Cashback', to: '/cashback' },
]

const infoLinks = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'signIn', label: 'Sign in', to: '/login' },
  { key: 'openAccount', label: 'Open account', to: '/register' },
  { key: 'support', label: 'Support', to: '/support' },
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

const floatingIcons = [
  { label: 'Notifications', src: notificationBubbleIcon, modifier: 'notification' },
  { label: 'Controls', src: controlBubbleIcon, modifier: 'control' },
  { label: 'News', src: newsBubbleIcon, modifier: 'news' },
]

const contactIconByKey = {
  address: contactItems[0].icon,
  mailUs: contactItems[1].icon,
  email: contactItems[1].icon,
  phone: contactItems[2].icon,
}

const isExternalUrl = (url = '') => /^(https?:|mailto:|tel:)/i.test(url)

function PublicFooter() {
  const {
    isInfoOpen,
    setIsInfoOpen,
    selectedLang,
    setSelectedLang,
    scrollToTop,
  } = usePublicFooter()

  const { lang, t } = useLanguage()
  const { footerLinks, footerContacts, footerSocials = [], footerDocuments = [] } = usePublicContent()

  const getDocUrl = (key) => {
    const doc = footerDocuments.find(d => d.docKey?.toLowerCase() === key.toLowerCase())
    return doc?.url || '#'
  }

  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [modalType, setModalType] = useState(null) // 'verify', 'unsubscribe', null
  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', isError: false })
  const inputRefs = useRef([])

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', isError: false })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message.text])

  const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setMessage({ text: '', isError: false })
    try {
      const res = await fetch(`${API_BASE_URL}/public-content/newsletter/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (!data.exists) {
        setMessage({ text: t(footerLang, 'emailNotFound'), isError: true })
      } else if (data.isSubscribed) {
        setModalType('unsubscribe')
      } else {
        setModalType('verify')
        setCode(['', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } catch (err) {
      setMessage({ text: t(footerLang, 'errorOccurred'), isError: true })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e?.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 4) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/public-content/newsletter/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      })
      if (!res.ok) throw new Error()
      setMessage({ text: t(footerLang, 'subSuccess'), isError: false })
      setModalType(null)
      setEmail('')
      setCode(['', '', '', ''])
    } catch (err) {
      setMessage({ text: t(footerLang, 'errorOccurred'), isError: true })
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/public-content/newsletter/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error()
      setMessage({ text: t(footerLang, 'unsubSuccess'), isError: false })
      setModalType(null)
      setEmail('')
    } catch (err) {
      setMessage({ text: t(footerLang, 'errorOccurred'), isError: true })
    } finally {
      setLoading(false)
    }
  }

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      const next = [...code]
      next[index] = ''
      setCode(next)
      return
    }
    const next = [...code]
    next[index] = cleaned[cleaned.length - 1]
    setCode(next)
    if (index < 3) {
      inputRefs.current[index + 1]?.focus()
    } else if (index === 3) {
      handleVerify()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const editableProductLinks = footerLinks.filter((link) => link.section === 'products')
  const editableInfoLinks = footerLinks.filter((link) => link.section === 'information')
  const productFooterLinks = editableProductLinks.length ? editableProductLinks : productLinks.map((link, index) => ({
    id: link.key,
    label: t(footerLang, link.key),
    url: link.to,
    sortOrder: index + 1,
    isExternal: false,
  }))
  const infoFooterLinks = editableInfoLinks.length ? editableInfoLinks : infoLinks.map((link, index) => ({
    id: link.key,
    label: t(footerLang, link.key),
    url: link.to,
    sortOrder: index + 1,
    isExternal: false,
  }))
  const bankContacts = footerContacts.length ? footerContacts.map((item) => ({
    id: item.id,
    key: item.contactKey,
    label: item.label,
    value: item.value,
    href: item.url,
    icon: contactIconByKey[item.contactKey?.toLowerCase()] || contactIconByKey.email,
  })) : contactItems.map((item) => ({
    id: item.key,
    key: item.key,
    label: t(footerLang, item.key),
    value: item.fallbackValue || t(footerLang, item.valueKey),
    href: item.href,
    icon: item.icon,
  }))

  const displaySocialLinks = socialLinks.map(link => {
    const dynamicUrl = footerSocials.find(s => s.label === link.label)?.url;
    return { ...link, href: dynamicUrl || link.href };
  })

  const renderFooterLink = (link) => {
    const href = link.url || '/'
    if (link.isExternal || isExternalUrl(href)) {
      return (
        <a key={link.id || href} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {link.label}
        </a>
      )
    }

    return (
      <Link key={link.id || href} to={href}>
        {link.label}
      </Link>
    )
  }

  const appFeatures = [
    {
      title: t(footerLang, 'feat1Title'),
      text: t(footerLang, 'feat1Text'),
    },
    {
      title: t(footerLang, 'feat2Title'),
      text: t(footerLang, 'feat2Text'),
    },
    {
      title: t(footerLang, 'feat3Title'),
      text: t(footerLang, 'feat3Text'),
    },
  ]

  return (
    <footer className="public-footer">
      <div className="public-footer__inner">
        <section className="public-footer__account" aria-labelledby="footer-account-title">
          <h2 id="footer-account-title" data-lang-key="contactUs">{t(footerLang, 'contactUs')}</h2>
          <ul className="public-footer__contact-list">
            {bankContacts.map((item) => (
              <li key={item.id}>
                <a href={item.href || '#'} target={(item.href || '').startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  <span className="public-footer__icon">{item.icon}</span>
                  <span>
                    <strong>{item.label}:</strong>{' '}
                    <span>{item.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <nav className="public-footer__links" aria-labelledby="footer-products-title">
          <h2 id="footer-products-title" data-lang-key="products">{t(footerLang, 'products')}</h2>
          {productFooterLinks.map(renderFooterLink)}
        </nav>

        <nav className="public-footer__links" aria-labelledby="footer-info-title">
          <h2 id="footer-info-title" data-lang-key="information">{t(footerLang, 'information')}</h2>
          {infoFooterLinks.map(renderFooterLink)}
        </nav>

        <section className="public-footer__subscribe" aria-labelledby="footer-subscribe-title">
          <h2 id="footer-subscribe-title" data-lang-key="subscribe">{t(footerLang, 'subscribe')}</h2>
          <form
            className="public-footer__form"
            onSubmit={handleSubscribeSubmit}
          >
            <label className="public-footer__sr-only" htmlFor="footer-email" data-lang-key="emailPlaceholder">
              {t(footerLang, 'emailPlaceholder')}
            </label>
            <input 
              id="footer-email" 
              type="email" 
              placeholder={t(footerLang, 'emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required 
            />
            <button type="submit" data-lang-key="subscribeBtn" disabled={loading}>
              {loading ? '...' : t(footerLang, 'subscribeBtn')}
            </button>
          </form>
          {message.text && (
            <p style={{ color: message.isError ? '#ff4d4d' : '#2ecc71', fontSize: '13px', marginTop: '8px' }}>
              {message.text}
            </p>
          )}
        </section>
      </div>

      <div className="public-footer__bottom">
        <div className="public-footer__copyright-col">
          <div className="public-footer__selectors">
            <div className="public-footer__lang-selector">
              <svg className="public-footer__lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <select
                className="public-footer__lang-select"
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="az">Azərbaycanca</option>
                <option value="ru">Русский</option>
              </select>
            </div>
            <button 
              className="public-footer__lang-selector" 
              onClick={() => setIsDocumentsOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <svg className="public-footer__lang-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', fontWeight: '600' }}>
                {t(footerLang, 'documentsLink', 'Documents')}
              </span>
            </button>
          </div>

          <p>
            {t(footerLang, 'copyrightPart1', 'Copyright 2026 ')}<span>NeoBank</span>{t(footerLang, 'copyrightPart2', '. All Rights Reserved')}
          </p>
        </div>

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
          {displaySocialLinks.map((link) => (
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
              <p className="public-footer__modal-eyebrow" data-lang-key="appEyebrow">{t(footerLang, 'appEyebrow')}</p>
              <h2 id="app-info-title" data-lang-key="appTitle">{t(footerLang, 'appTitle')}</h2>
              <p data-lang-key="appDesc">{t(footerLang, 'appDesc')}</p>

              <div className="public-footer__modal-features">
                {appFeatures.map((feature, i) => (
                  <article key={i}>
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

      {isDocumentsOpen && (
        <div className="public-footer__modal-backdrop" role="presentation" onMouseDown={() => setIsDocumentsOpen(false)}>
          <section
            className="public-footer__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="documents-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
            style={{ maxWidth: '700px', width: '90%', display: 'block' }}
          >
            <button className="public-footer__modal-close" type="button" aria-label="Close documents" onClick={() => setIsDocumentsOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12" />
                <path d="M18 6 6 18" />
              </svg>
            </button>

            <div className="public-footer__modal-content" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
              <h2 id="documents-modal-title" data-lang-key="documentsTitle" style={{ marginBottom: '1.5rem', textAlign: 'center', maxWidth: '100%' }}>{t(footerLang, 'documentsTitle')}</h2>
              
              <div className="public-footer__documents-grid">
                <a href={getDocUrl('userAgreement')} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', background: '#25202c', padding: '1.25rem 1rem', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s', border: '1px solid rgba(255, 255, 255, 0.05)', minHeight: '80px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#2f2937'} onMouseLeave={(e) => e.currentTarget.style.background = '#25202c'}>
                  <img src={userAgreementIcon} alt="" style={{ width: '48px', minWidth: '48px', height: '48px', marginRight: '16px' }} />
                  <span style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4' }}>{t(footerLang, 'userAgreement')}</span>
                </a>
                <a href={getDocUrl('rules')} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', background: '#25202c', padding: '1.25rem 1rem', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s', border: '1px solid rgba(255, 255, 255, 0.05)', minHeight: '80px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#2f2937'} onMouseLeave={(e) => e.currentTarget.style.background = '#25202c'}>
                  <img src={rulesIcon} alt="" style={{ width: '48px', minWidth: '48px', height: '48px', marginRight: '16px' }} />
                  <span style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4' }}>{t(footerLang, 'rules')}</span>
                </a>
                <a href={getDocUrl('privacyPolicy')} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', background: '#25202c', padding: '1.25rem 1rem', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s', border: '1px solid rgba(255, 255, 255, 0.05)', minHeight: '80px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#2f2937'} onMouseLeave={(e) => e.currentTarget.style.background = '#25202c'}>
                  <img src={privacyPolicyIcon} alt="" style={{ width: '48px', minWidth: '48px', height: '48px', marginRight: '16px' }} />
                  <span style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4' }}>{t(footerLang, 'privacyPolicy')}</span>
                </a>
                <a href={getDocUrl('personalDataProcessing')} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', background: '#25202c', padding: '1.25rem 1rem', borderRadius: '12px', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s', border: '1px solid rgba(255, 255, 255, 0.05)', minHeight: '80px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#2f2937'} onMouseLeave={(e) => e.currentTarget.style.background = '#25202c'}>
                  <img src={personalDataIcon} alt="" style={{ width: '48px', minWidth: '48px', height: '48px', marginRight: '16px' }} />
                  <span style={{ fontSize: '15px', fontWeight: '600', lineHeight: '1.4' }}>{t(footerLang, 'personalDataProcessing')}</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      {modalType === 'verify' && (
        <div className="card-modal-overlay" onClick={() => !loading && setModalType(null)} style={{ zIndex: 9999 }}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(footerLang, 'verifyCodeTitle')}</h2>
              <button className="close-btn" onClick={() => !loading && setModalType(null)}>✕</button>
            </div>
            <div className="card-modal__content" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                {t(footerLang, 'verifyCodeDesc')}
              </p>
              <form onSubmit={handleVerify}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading}
                      style={{
                        width: '48px', height: '56px', fontSize: '24px', textAlign: 'center',
                        backgroundColor: '#1c1823', border: '1px solid rgba(255,226,138,0.2)',
                        borderRadius: '8px', color: '#fff'
                      }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '12px', background: 'linear-gradient(135deg, #FFE28A, #F3C24A 48%, #b47012)', color: '#211405',
                  border: 'none', borderRadius: '8px', fontWeight: '850', cursor: 'pointer', fontSize: '13px'
                }}>
                  {loading ? '...' : t(footerLang, 'verifyBtn')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {modalType === 'unsubscribe' && (
        <div className="card-modal-overlay" onClick={() => !loading && setModalType(null)} style={{ zIndex: 9999 }}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(footerLang, 'unsubscribeConfirmTitle')}</h2>
              <button className="close-btn" onClick={() => !loading && setModalType(null)}>✕</button>
            </div>
            <div className="card-modal__content" style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                {t(footerLang, 'unsubscribeConfirmDesc')}
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button disabled={loading} onClick={handleUnsubscribe} style={{
                  flex: 1, padding: '12px', background: 'linear-gradient(135deg, #FFE28A, #F3C24A 48%, #b47012)', color: '#211405',
                  border: 'none', borderRadius: '8px', fontWeight: '850', cursor: 'pointer', fontSize: '13px'
                }}>
                  {loading ? '...' : t(footerLang, 'yesBtn')}
                </button>
                <button disabled={loading} onClick={() => setModalType(null)} style={{
                  flex: 1, padding: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}>
                  {t(footerLang, 'noBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default PublicFooter
