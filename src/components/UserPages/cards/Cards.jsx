import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Cards.scss'
import standartCard from '../../../assets/images/standart_card_mc.png'
import premiumCard from '../../../assets/images/premium_card_mc.png'
import eliteCard from '../../../assets/images/elite_card_mc.png'

import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { userCardsLang } from './lang.js'

import blockIcon from '../../../assets/icons/User/settings/block.svg'
import limitIcon from '../../../assets/icons/User/settings/limit.svg'
import googlePayIcon from '../../../assets/icons/User/settings/google_pay.svg'
import cardDesignIcon from '../../../assets/icons/User/settings/card_design.svg'
import limitsIcon from '../../../assets/icons/User/settings/limits_icon.svg'
import pinIcon from '../../../assets/icons/User/settings/pin.svg'
import securityIcon from '../../../assets/icons/User/settings/security.svg'
import subscriptionsIcon from '../../../assets/icons/User/settings/subscriptions.svg'
import statementsIcon from '../../../assets/icons/User/settings/statements.svg'
import accountIcon from '../../../assets/icons/User/settings/account.svg'

import transferMyIcon from '../../../assets/icons/User/settings/transfer_my.svg'
import transferAnyIcon from '../../../assets/icons/User/settings/transfer_any.svg'
import transferForeignIcon from '../../../assets/icons/User/settings/transfer_foreign.svg'

import qrCodeIcon from '../../../assets/icons/User/settings/qr_code.svg'
import addProductIcon from '../../../assets/icons/User/settings/add_product.svg'

import vatBubbleIcon from '../../../assets/icons/User/vat_bubble.svg'
import shoppingBubbleIcon from '../../../assets/icons/User/shopping_bubble.svg'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const cardImages = {
  Standard: standartCard,
  Premium: premiumCard,
  Elite: eliteCard
}

const categoryProgram = [
  { title: 'Every 5th metro or bus ride', rate: '100%', text: 'Calculated from the average fare across all five rides.', earned: 2.50 },
  { title: 'Supermarkets', rate: '5%', text: 'Everyday grocery spending earns the highest retail rate.', earned: 8.40 },
  { title: 'Pharmacies', rate: '3%', text: 'Health and pharmacy purchases are included automatically.', earned: 1.20 },
  { title: 'Fuel stations', rate: '3%', text: 'Cashback for regular car expenses and fuel payments.', earned: 4.50 },
  { title: 'Restaurants, cafes, sweets', rate: '2%', text: 'Dining, coffee, desserts, and similar food categories.', earned: 5.80 },
  { title: 'Clothing and shoes', rate: '2%', text: 'Fashion, footwear, and wardrobe essentials.', earned: 3.00 },
  { title: 'Trendyol and Temu', rate: '1%', text: 'Online marketplace purchases through popular platforms.', earned: 0.00 },
  { title: 'Other payments', rate: '0.1%', text: 'A base reward for payments outside the main categories.', earned: 0.15 },
]

const Cards = () => {
  const { t } = useLanguage()
  const { token, user } = useAuth()
  const location = useLocation()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCardId, setActiveCardId] = useState(null)
  const [selectedSettingsCard, setSelectedSettingsCard] = useState(null)
  const [selectedTransferCard, setSelectedTransferCard] = useState(null)
  const [showVatModal, setShowVatModal] = useState(false)
  const [showLimits, setShowLimits] = useState(false)


  const [showNewCardModal, setShowNewCardModal] = useState(false)
  const [newCardForm, setNewCardForm] = useState({
    cardType: location.state?.orderCardType || 'Standard',
    network: 'Visa',
    paymentMethod: 'balance',
    sourceCardId: ''
  })
  const [newCardError, setNewCardError] = useState('')
  const [submittingCard, setSubmittingCard] = useState(false)

  const fetchCards = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setCards(data)
        if (data.length > 0) {
          setActiveCardId(data[0].id)
          setNewCardForm(prev => ({ ...prev, sourceCardId: data[0].id }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
    if (location.state?.orderCardType) {
      setShowNewCardModal(true)
    }
  }, [token])

  const totalEarned = categoryProgram.reduce((sum, item) => sum + item.earned, 0).toFixed(2);

  const handleAcquireCard = async (e) => {
    e.preventDefault()
    setNewCardError('')


    if (cards.some(c => c.cardType.toLowerCase() === newCardForm.cardType.toLowerCase())) {
      setNewCardError(`Вы уже владеете картой типа ${newCardForm.cardType}. Каждому пользователю разрешено иметь только 1 карту каждого типа.`)
      return
    }

    const fee = newCardForm.cardType === 'Premium' ? 10 : (newCardForm.cardType === 'Elite' ? 25 : 0)

    if (fee > 0 && newCardForm.paymentMethod === 'balance') {
      const source = cards.find(c => c.id === newCardForm.sourceCardId)
      if (!source || source.balance < fee) {
        setNewCardError(`Недостаточно средств на выбранной карте для оплаты первого месяца (${fee} AZN).`)
        return
      }
    }

    try {
      setSubmittingCard(true)
      const res = await fetch(`${API_BASE_URL}/cards/acquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardType: newCardForm.cardType,
          network: newCardForm.network,
          paymentMethod: fee === 0 ? 'free' : newCardForm.paymentMethod,
          sourceCardId: newCardForm.sourceCardId
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Ошибка оформления карты')
      }

      setShowNewCardModal(false)
      fetchCards()
    } catch (err) {
      setNewCardError(err.message)
    } finally {
      setSubmittingCard(false)
    }
  }

  const handleToggleBlock = async (cardId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cards/toggle-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cardId })
      })

      if (res.ok) {
        fetchCards()
        setSelectedSettingsCard(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="user-cards-page">
      <div className="cards-header">
        <h1 data-lang-key="title">{t(userCardsLang, 'title')}</h1>
      </div>

      {loading ? (
        <div className="cards-loading">Загрузка карт...</div>
      ) : cards.length === 0 ? (
        <div className="no-cards-banner">
          <p>У вас пока нет оформленных карт.</p>
          <button className="add-product-btn" onClick={() => setShowNewCardModal(true)}>
            <span>Оформить первую карту</span>
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {cards.map(card => (
            <div
              key={card.id}
              className={`card-item ${activeCardId === card.id ? 'active' : ''}`}
              onClick={() => setActiveCardId(card.id)}
            >
              <div className="card-image-wrapper">
                <img
                  src={cardImages[card.cardType] || standartCard}
                  alt={`${card.cardType} Card`}
                  className="card-image"
                />
              </div>
              <div className="card-details">
                <div className="card-info-header">
                  <h2>{card.cardType} Card ({card.network})</h2>
                  <span className={`status ${card.status.toLowerCase()}`}>{card.status}</span>
                </div>
                <div className="card-balance">
                  <span className="label">Available Balance</span>
                  <span className="amount">{Number(card.balance).toFixed(2)} AZN</span>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTransferCard(card);
                    }}
                  >
                    Transfer
                  </button>
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSettingsCard(card);
                    }}
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cards-cashback-section">
        <div className="cashback-section-header">
          <div className="cashback-title-row">
            <img src={shoppingBubbleIcon} className="cashback-section-icon" alt="" />
            <h2>Cashback Categories</h2>
            <button className="info-toggle-btn" onClick={() => setShowLimits(!showLimits)}>i</button>
          </div>
          <div className="total-cashback">
            <span>Total Earned: </span>
            <strong>{totalEarned} ₼</strong>
          </div>
        </div>
        <div className="cashback-offers">
          {categoryProgram.map((item) => (
            <div className="cashback-offer" key={item.title}>
              <strong>{item.rate}</strong>
              <div className="cashback-offer-info">
                <h4>{item.title}</h4>
                <p>{item.text}</p>
                {showLimits && (
                  <div className="cashback-limits">
                    <span className="limit">Limit: 10 ₼</span>
                    <span className="earned">Earned: {item.earned.toFixed(2)} ₼</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cards-footer">
        <button className="scan-qr-btn">
          <img src={qrCodeIcon} className="btn-svg-icon" alt="" />
          <span>Scan QR code</span>
        </button>
        <button className="add-product-btn" onClick={() => setShowNewCardModal(true)}>
          <img src={addProductIcon} className="btn-svg-icon" alt="" />
          <span>Add new product</span>
        </button>
      </div>


      {showNewCardModal && (
        <div className="card-modal-overlay" onClick={() => setShowNewCardModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>Оформление новой карты</h2>
              <button className="close-btn" onClick={() => setShowNewCardModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <form onSubmit={handleAcquireCard} className="new-card-form">
                {newCardError && <div className="form-error" style={{ color: '#ff4d4f', marginBottom: '12px' }}>{newCardError}</div>}

                <div className="form-group">
                  <label>Тип карты</label>
                  <select
                    value={newCardForm.cardType}
                    onChange={e => setNewCardForm({ ...newCardForm, cardType: e.target.value })}
                  >
                    <option value="Standard">Standard (0.00 AZN / мес)</option>
                    <option value="Premium">Premium (10.00 AZN / мес)</option>
                    <option value="Elite">Elite (25.00 AZN / мес)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Платежная система</label>
                  <select
                    value={newCardForm.network}
                    onChange={e => setNewCardForm({ ...newCardForm, network: e.target.value })}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>

                {(newCardForm.cardType === 'Premium' || newCardForm.cardType === 'Elite') && (
                  <div className="fee-payment-box" style={{ background: '#1d1929', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ffd700' }}>
                      Оплата первого месяца подписки ({newCardForm.cardType === 'Premium' ? '10' : '25'} AZN):
                    </p>

                    <div className="form-group">
                      <label>Способ оплаты</label>
                      <select
                        value={newCardForm.paymentMethod}
                        onChange={e => setNewCardForm({ ...newCardForm, paymentMethod: e.target.value })}
                      >
                        <option value="balance">С баланса имеющейся карты</option>
                        <option value="stripe">Картой любого банка (Stripe)</option>
                      </select>
                    </div>

                    {newCardForm.paymentMethod === 'balance' && (
                      <div className="form-group">
                        <label>Выберите карту для списания</label>
                        <select
                          value={newCardForm.sourceCardId}
                          onChange={e => setNewCardForm({ ...newCardForm, sourceCardId: e.target.value })}
                        >
                          {cards.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.cardType} ({c.cardNumber.slice(-4)}) - {Number(c.balance).toFixed(2)} AZN
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="cards-page__button cards-page__button--primary"
                  style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                  disabled={submittingCard}
                >
                  {submittingCard ? 'Оформление...' : 'Заказать карту'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedSettingsCard && (
        <div className="card-modal-overlay" onClick={() => setSelectedSettingsCard(null)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>Card Settings</h2>
              <button className="close-btn" onClick={() => setSelectedSettingsCard(null)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section">
                <h3>Card Details</h3>
                <div className="detail-row">
                  <span className="label">Cardholder</span>
                  <span className="value">{selectedSettingsCard.holderName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Type</span>
                  <span className="value">{selectedSettingsCard.cardType} ({selectedSettingsCard.network})</span>
                </div>
                <div className="detail-row">
                  <span className="label">Number</span>
                  <span className="value">{selectedSettingsCard.cardNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Expiry Date</span>
                  <span className="value">{selectedSettingsCard.expiryDate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">CVV</span>
                  <span className="value">{selectedSettingsCard.cvv}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status</span>
                  <span className={`status ${selectedSettingsCard.status.toLowerCase()}`}>{selectedSettingsCard.status}</span>
                </div>
              </div>

              <div className="settings-section">
                <h3>Settings</h3>
                <button
                  className="settings-action-btn danger"
                  onClick={() => handleToggleBlock(selectedSettingsCard.id)}
                >
                  <img src={blockIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{selectedSettingsCard.status === 'Active' ? 'Block Plastic Card' : 'Unblock Plastic Card'}</span>
                    <span className="btn-subtitle">Toggle card status</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cards
