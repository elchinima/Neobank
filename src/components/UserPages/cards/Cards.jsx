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


    const existingSameType = cards.find(c => c.cardType === newCardForm.cardType)
    if (existingSameType) {
      setNewCardError(t(userCardsLang, 'cardLimitReached').replace('{cardType}', newCardForm.cardType))
      return
    }

    const fee = newCardForm.cardType === 'Premium' ? 10 : (newCardForm.cardType === 'Elite' ? 25 : 0)

    if (fee > 0 && newCardForm.paymentMethod === 'balance') {
      const sourceCard = cards.find(c => c.id === newCardForm.sourceCardId)
      if (!sourceCard || sourceCard.balance < fee) {
        setNewCardError(t(userCardsLang, 'insufficientFunds').replace('{fee}', fee))
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
        throw new Error(data.message || t(userCardsLang, 'orderCardError'))
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
        <div className="cards-loading" data-lang-key="loadingCards">{t(userCardsLang, 'loadingCards')}</div>
      ) : cards.length === 0 ? (
        <div className="no-cards-banner">
          <p data-lang-key="noCards">{t(userCardsLang, 'noCards')}</p>
          <button className="add-product-btn" onClick={() => setShowNewCardModal(true)}>
            <span data-lang-key="orderFirstCard">{t(userCardsLang, 'orderFirstCard')}</span>
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
                  <span className="label" data-lang-key="availableBalance">{t(userCardsLang, 'availableBalance')}</span>
                  <span className="amount">{Number(card.balance).toFixed(2)} AZN</span>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTransferCard(card);
                    }}
                    data-lang-key="transfer"
                  >
                    {t(userCardsLang, 'transfer')}
                  </button>
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSettingsCard(card);
                    }}
                    data-lang-key="settings"
                  >
                    {t(userCardsLang, 'settings')}
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
            <h2 data-lang-key="cashbackCategories">{t(userCardsLang, 'cashbackCategories')}</h2>
            <button className="info-toggle-btn" onClick={() => setShowLimits(!showLimits)}>i</button>
          </div>
          <div className="total-cashback">
            <span data-lang-key="totalEarned">{t(userCardsLang, 'totalEarned')} </span>
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
                    <span className="limit"><span data-lang-key="limitAmount">{t(userCardsLang, 'limitAmount')}</span> 10 ₼</span>
                    <span className="earned"><span data-lang-key="earnedAmount">{t(userCardsLang, 'earnedAmount')}</span> {item.earned.toFixed(2)} ₼</span>
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
          <span data-lang-key="scanQrCode">{t(userCardsLang, 'scanQrCode')}</span>
        </button>
        <button className="add-product-btn" onClick={() => setShowNewCardModal(true)}>
          <img src={addProductIcon} className="btn-svg-icon" alt="" />
          <span data-lang-key="addNewProduct">{t(userCardsLang, 'addNewProduct')}</span>
        </button>
      </div>


      {showNewCardModal && (
        <div className="card-modal-overlay" onClick={() => setShowNewCardModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="orderNewCardModalTitle">{t(userCardsLang, 'orderNewCardModalTitle')}</h2>
              <button className="close-btn" onClick={() => setShowNewCardModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <form onSubmit={handleAcquireCard} className="new-card-form">
                {newCardError && <div className="form-error" style={{ color: '#ff4d4f', marginBottom: '12px' }}>{newCardError}</div>}

                <div className="form-group">
                  <label data-lang-key="cardType">{t(userCardsLang, 'cardType')}</label>
                  <select
                    value={newCardForm.cardType}
                    onChange={e => setNewCardForm({ ...newCardForm, cardType: e.target.value })}
                  >
                    <option value="Standard">Standard (0.00 AZN / {t(userCardsLang, 'monthly', 'month')})</option>
                    <option value="Premium">Premium (10.00 AZN / {t(userCardsLang, 'monthly', 'month')})</option>
                    <option value="Elite">Elite (25.00 AZN / {t(userCardsLang, 'monthly', 'month')})</option>
                  </select>
                </div>

                <div className="form-group">
                  <label data-lang-key="paymentNetwork">{t(userCardsLang, 'paymentNetwork')}</label>
                  <select
                    value={newCardForm.network}
                    onChange={e => setNewCardForm({ ...newCardForm, network: e.target.value })}
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>

                {(newCardForm.cardType === 'Premium' || newCardForm.cardType === 'Elite') && (
                  <div className="fee-payment-box">
                    <p className="fee-payment-text">
                      <span data-lang-key="feePaymentBoxText">{t(userCardsLang, 'feePaymentBoxText')}</span> ({newCardForm.cardType === 'Premium' ? '10' : '25'} AZN):
                    </p>

                    <div className="form-group">
                      <label data-lang-key="paymentMethod">{t(userCardsLang, 'paymentMethod')}</label>
                      <select
                        value={newCardForm.paymentMethod}
                        onChange={e => setNewCardForm({ ...newCardForm, paymentMethod: e.target.value })}
                      >
                        <option value="balance">{t(userCardsLang, 'balanceMethod')}</option>
                        <option value="stripe">{t(userCardsLang, 'stripeMethod')}</option>
                      </select>
                    </div>

                    {newCardForm.paymentMethod === 'balance' && (
                      <div className="form-group">
                        <label data-lang-key="selectSourceCard">{t(userCardsLang, 'selectSourceCard')}</label>
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
                  className="cards-page__button cards-page__button--primary submit-order-btn"
                  disabled={submittingCard}
                >
                  {submittingCard ? t(userCardsLang, 'submitting') : t(userCardsLang, 'submitCard')}
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
              <h2 data-lang-key="settings">{t(userCardsLang, 'settings')}</h2>
              <button className="close-btn" onClick={() => setSelectedSettingsCard(null)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section">
                <h3 data-lang-key="cardDetails">{t(userCardsLang, 'cardDetails')}</h3>
                <div className="detail-row">
                  <span className="label" data-lang-key="cardholder">{t(userCardsLang, 'cardholder')}</span>
                  <span className="value">{selectedSettingsCard.holderName}</span>
                </div>
                <div className="detail-row">
                  <span className="label" data-lang-key="cardType">{t(userCardsLang, 'cardType')}</span>
                  <span className="value">{selectedSettingsCard.cardType} ({selectedSettingsCard.network})</span>
                </div>
                <div className="detail-row">
                  <span className="label" data-lang-key="number">{t(userCardsLang, 'number')}</span>
                  <span className="value">{selectedSettingsCard.cardNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="label" data-lang-key="expiry">{t(userCardsLang, 'expiry')}</span>
                  <span className="value">{selectedSettingsCard.expiryDate}</span>
                </div>
                <div className="detail-row">
                  <span className="label" data-lang-key="cvv">{t(userCardsLang, 'cvv')}</span>
                  <span className="value">{selectedSettingsCard.cvv}</span>
                </div>
                <div className="detail-row">
                  <span className="label" data-lang-key="status">{t(userCardsLang, 'status')}</span>
                  <span className={`status ${selectedSettingsCard.status.toLowerCase()}`}>{t(userCardsLang, selectedSettingsCard.status.toLowerCase(), selectedSettingsCard.status)}</span>
                </div>
              </div>

              <div className="settings-section">
                <h3 data-lang-key="settings">{t(userCardsLang, 'settings')}</h3>
                <button
                  className="settings-action-btn danger"
                  onClick={() => handleToggleBlock(selectedSettingsCard.id)}
                >
                  <img src={blockIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{selectedSettingsCard.status === 'Active' ? t(userCardsLang, 'blockPlasticCard') : t(userCardsLang, 'unblockPlasticCard')}</span>
                    <span className="btn-subtitle" data-lang-key="toggleCardStatus">{t(userCardsLang, 'toggleCardStatus')}</span>
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
