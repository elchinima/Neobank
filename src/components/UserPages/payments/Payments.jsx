import { useState, useEffect } from 'react'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { paymentsLang } from './lang.js'
import './Payments.scss'

import utilitiesIcon from '../../../assets/icons/User/utilities_bubble.svg'
import transportIcon from '../../../assets/icons/User/transport_bubble.svg'
import shoppingIcon from '../../../assets/icons/User/shopping_bubble.svg'
import foodIcon from '../../../assets/icons/User/food_bubble.svg'
import vatIcon from '../../../assets/icons/User/vat_bubble.svg'
import newsIcon from '../../../assets/icons/Public/news_bubble.svg'
import entertainmentIcon from '../../../assets/icons/User/entertainment_bubble.svg'
import controlIcon from '../../../assets/icons/Public/control_bubble.svg'

import mobileIcon from '../../../assets/icons/User/payments/mobile.svg'
import bankIcon from '../../../assets/icons/User/payments/bank.svg'
import bakikartIcon from '../../../assets/icons/User/payments/bakikart.svg'
import internetIcon from '../../../assets/icons/User/payments/internet.svg'
import tvIcon from '../../../assets/icons/User/payments/tv.svg'
import phoneIcon from '../../../assets/icons/User/payments/phone.svg'
import insuranceIcon from '../../../assets/icons/User/payments/insurance.svg'
import medicalIcon from '../../../assets/icons/User/payments/medical.svg'
import bettingIcon from '../../../assets/icons/User/payments/betting.svg'
import agencyIcon from '../../../assets/icons/User/payments/agency.svg'
import educationIcon from '../../../assets/icons/User/payments/education.svg'
import hotelsIcon from '../../../assets/icons/User/payments/hotels.svg'
import taxiIcon from '../../../assets/icons/User/payments/taxi.svg'
import parkingIcon from '../../../assets/icons/User/payments/parking.svg'
import charityIcon from '../../../assets/icons/User/payments/charity.svg'
import housingIcon from '../../../assets/icons/User/payments/housing.svg'
import brokerIcon from '../../../assets/icons/User/payments/broker.svg'
import otherIcon from '../../../assets/icons/User/payments/other.svg'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const paymentCategories = [
  { name: 'Mobile Operators', id: 1, icon: mobileIcon },
  { name: 'Utilities', id: 2, icon: utilitiesIcon },
  { name: 'Banking Services', id: 3, icon: bankIcon },
  { name: 'BakıKart', id: 4, icon: bakikartIcon },
  { name: 'Transport', id: 5, icon: transportIcon },
  { name: 'Fines', id: 6, icon: vatIcon },
  { name: 'Government Payments', id: 7, icon: vatIcon },
  { name: 'Internet', id: 8, icon: internetIcon },
  { name: 'Cable TV', id: 9, icon: tvIcon },
  { name: 'Telephone', id: 10, icon: phoneIcon },
  { name: 'Insurance', id: 11, icon: insuranceIcon },
  { name: 'E-commerce', id: 12, icon: shoppingIcon },
  { name: 'Delivery Services', id: 13, icon: foodIcon },
  { name: 'Ads & Coupons', id: 14, icon: newsIcon },
  { name: 'Medical Services', id: 15, icon: medicalIcon },
  { name: 'Entertainment', id: 16, icon: entertainmentIcon },
  { name: 'Betting', id: 17, icon: bettingIcon },
  { name: 'Agency Network', id: 18, icon: agencyIcon },
  { name: 'Education', id: 19, icon: educationIcon },
  { name: 'Hotels', id: 20, icon: hotelsIcon },
  { name: 'Taxi', id: 21, icon: taxiIcon },
  { name: 'Parking', id: 22, icon: parkingIcon },
  { name: 'Charity', id: 23, icon: charityIcon },
  { name: 'Housing Payments', id: 24, icon: housingIcon },
  { name: 'POS Operators', id: 25, icon: controlIcon },
  { name: 'Brokerage Services', id: 26, icon: brokerIcon },
  { name: 'Other', id: 27, icon: otherIcon },
]

const avatarColors = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
  'linear-gradient(135deg, #f5576c, #ff6a00)',
  'linear-gradient(135deg, #0250c5, #d43f8d)',
]

const getAvatarColor = (id) => avatarColors[id % avatarColors.length]

const providersData = {
  1: [{ id: 101, name: 'Azercell' }, { id: 102, name: 'Bakcell' }, { id: 103, name: 'Nar Mobile' }, { id: 104, name: 'Naxtel' }],
  2: [{ id: 201, name: 'Azərişıq' }, { id: 202, name: 'Azərsu' }, { id: 203, name: 'Azəriqaz' }],
  3: [{ id: 301, name: 'Kapital Bank' }, { id: 302, name: 'ABB' }, { id: 303, name: 'Pasha Bank' }],
  4: [{ id: 401, name: 'BakıKart' }],
  8: [{ id: 801, name: 'Baktelecom' }, { id: 802, name: 'CityNet' }, { id: 803, name: 'KATV1 Internet' }],
  27: [{ id: 2701, name: 'Other Services' }]
}

const getPaymentFieldInfo = (categoryId) => {
  switch (categoryId) {
    case 1: return { label: 'Phone Number', placeholder: 'e.g. 501234567', type: 'tel', inputMode: 'numeric', maxLength: 9 }
    case 2: return { label: 'Subscriber Code', placeholder: 'Enter subscriber code...' }
    case 4: return { label: 'Card Number', placeholder: 'Enter 16-digit card number...', type: 'tel', inputMode: 'numeric', maxLength: 16 }
    default: return { label: 'Account / Reference Number', placeholder: 'Enter details...' }
  }
}

const Payments = () => {
  const { t } = useLanguage()
  const { token } = useAuth()
  const [search, setSearch] = useState('')
  const [userCards, setUserCards] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ account: '', amount: '', cardId: '' })
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setUserCards(data)
            setPaymentForm(prev => ({ ...prev, cardId: data[0].id }))
          }
        })
        .catch(err => console.error(err))
    }
  }, [token])

  const handlePay = async (e) => {
    e.preventDefault()
    if (!paymentForm.account || !paymentForm.amount || !paymentForm.cardId) return

    setPaymentStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: paymentForm.cardId,
          providerName: selectedProvider.name,
          categoryName: selectedCategory.name,
          recipientAccount: paymentForm.account,
          amount: parseFloat(paymentForm.amount)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || t(paymentsLang, 'paymentError'))
      }

      setPaymentStatus('success')
    } catch (err) {
      setErrorMessage(err.message)
      setPaymentStatus('idle')
    }
  }

  const filteredCategories = paymentCategories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="payments-page">
      <div className="payments-page__header">
        <h1 data-lang-key="title">{t(paymentsLang, 'title')}</h1>
      </div>

      <div className="payments-page__search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="payments-page__list">
        {filteredCategories.map(category => (
          <div
            key={category.id}
            className="payment-category-item"
            onClick={() => setSelectedCategory(category)}
          >
            <div className="payment-category-item__icon">
              <img src={category.icon} alt={category.name} />
            </div>
            <div className="payment-category-item__name">
              {category.name}
            </div>
          </div>
        ))}
      </div>

      {selectedCategory && (
        <div className="payment-modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div className="payment-modal__header">
              {selectedProvider && paymentStatus !== 'success' && paymentStatus !== 'loading' ? (
                <button className="back-btn" onClick={() => {
                  setSelectedProvider(null);
                  setPaymentStatus('idle');
                  setErrorMessage('');
                }}>←</button>
              ) : null}
              <h2>{selectedProvider ? (paymentStatus === 'success' ? t(paymentsLang, 'paymentSuccessfulTitle') : selectedProvider.name) : `${selectedCategory.name} ${t(paymentsLang, 'providersTitle')}`}</h2>
              <button className="close-btn" onClick={() => {
                setSelectedCategory(null);
                setSelectedProvider(null);
                setPaymentStatus('idle');
                setPaymentForm({ account: '', amount: '', cardId: userCards[0]?.id || '' });
              }}>✕</button>
            </div>
            <div className="payment-modal__content">
              {selectedProvider ? (
                <div className="payment-simulation">
                  {paymentStatus === 'idle' && (
                    <form className="payment-form" onSubmit={handlePay}>
                      {errorMessage && <p style={{ color: '#ff4d4f', marginBottom: '10px' }}>{errorMessage}</p>}
                      <div className="form-group">
                        <label>{t(paymentsLang, 'payFromCard')}</label>
                        <select
                          value={paymentForm.cardId}
                          onChange={e => setPaymentForm({ ...paymentForm, cardId: e.target.value })}
                          required
                        >
                          {userCards.map(card => (
                            <option key={card.id} value={card.id}>
                              {card.cardType} (**** {card.cardNumber.slice(-4)}) - {Number(card.balance).toFixed(2)} AZN
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{getPaymentFieldInfo(selectedCategory.id).label}</label>
                        <input
                          type={getPaymentFieldInfo(selectedCategory.id).type || 'text'}
                          inputMode={getPaymentFieldInfo(selectedCategory.id).inputMode || 'text'}
                          maxLength={getPaymentFieldInfo(selectedCategory.id).maxLength}
                          minLength={getPaymentFieldInfo(selectedCategory.id).maxLength}
                          placeholder={getPaymentFieldInfo(selectedCategory.id).placeholder}
                          value={paymentForm.account}
                          onChange={e => setPaymentForm({ ...paymentForm, account: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>{t(paymentsLang, 'amountAZN')}</label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="0.00"
                          value={paymentForm.amount}
                          onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          required
                        />
                      </div>
                      <button type="submit" className="pay-btn" disabled={!paymentForm.account || !paymentForm.amount}>
                        {t(paymentsLang, 'pay')} {paymentForm.amount ? `${paymentForm.amount} AZN` : ''}
                      </button>
                    </form>
                  )}
                  {paymentStatus === 'loading' && (
                    <div className="payment-loading">
                      <div className="spinner"></div>
                      <p>{t(paymentsLang, 'processingPayment')}</p>
                    </div>
                  )}
                  {paymentStatus === 'success' && (
                    <div className="payment-success">
                      <div className="success-icon">✓</div>
                      <h3>{t(paymentsLang, 'paymentCompleted')}</h3>
                      <p>{t(paymentsLang, 'paymentSuccessDesc1')} {paymentForm.amount} {t(paymentsLang, 'paymentSuccessDesc2')} {selectedProvider.name} {t(paymentsLang, 'paymentSuccessDesc3')}</p>
                      <button className="done-btn" onClick={() => {
                        setSelectedCategory(null);
                        setSelectedProvider(null);
                        setPaymentStatus('idle');
                        setPaymentForm({ account: '', amount: '', cardId: userCards[0]?.id || '' });
                      }}>{t(paymentsLang, 'doneBtn')}</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="provider-list">
                  {(providersData[selectedCategory.id] || providersData[27]).map(provider => (
                    <div key={provider.id} className="provider-item" onClick={() => setSelectedProvider(provider)}>
                      <div className="provider-icon-placeholder" style={{ background: getAvatarColor(provider.id) }}>
                        {provider.name.charAt(0)}
                      </div>
                      <span>{provider.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
