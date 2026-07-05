import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './Cards.scss'
import standartCardMc from '../../../assets/images/standart_card_mc.png'
import premiumCardMc from '../../../assets/images/premium_card_mc.png'
import eliteCardMc from '../../../assets/images/elite_card_mc.png'
import standartCardVisa from '../../../assets/images/standart_card_visa.png'
import premiumCardVisa from '../../../assets/images/premium_card_visa.png'
import eliteCardVisa from '../../../assets/images/elite_card_visa.png'

const cardImages = {
  Standard: { Mastercard: standartCardMc, Visa: standartCardVisa },
  Premium: { Mastercard: premiumCardMc, Visa: premiumCardVisa },
  Elite: { Mastercard: eliteCardMc, Visa: eliteCardVisa }
}

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

  const [showInternalTransferModal, setShowInternalTransferModal] = useState(false)
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [internalTransferForm, setInternalTransferForm] = useState({ sourceCardId: '', destCardId: '', amount: '' })
  const [internalTransferStatus, setInternalTransferStatus] = useState('idle')
  const [internalTransferError, setInternalTransferError] = useState('')
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

  const categoryProgram = [
    { titleKey: 'catMetroTitle', textKey: 'catMetroText', rate: '100%', earned: 2.50 },
    { titleKey: 'catSuperTitle', textKey: 'catSuperText', rate: '5%', earned: 8.40 },
    { titleKey: 'catPharmTitle', textKey: 'catPharmText', rate: '3%', earned: 1.20 },
    { titleKey: 'catFuelTitle', textKey: 'catFuelText', rate: '3%', earned: 4.50 },
    { titleKey: 'catRestTitle', textKey: 'catRestText', rate: '2%', earned: 5.80 },
    { titleKey: 'catClothTitle', textKey: 'catClothText', rate: '2%', earned: 3.00 },
    { titleKey: 'catTrendTitle', textKey: 'catTrendText', rate: '1%', earned: 0.00 },
    { titleKey: 'catOtherTitle', textKey: 'catOtherText', rate: '0.1%', earned: 0.15 },
  ]
  const totalEarned = categoryProgram.reduce((sum, item) => sum + item.earned, 0).toFixed(2);
  const [showStripeMock, setShowStripeMock] = useState(false);

  const handleAcquireCard = async (e) => {
    e.preventDefault()
    setNewCardError('')


    const existingSameType = cards.find(c => c.cardType === newCardForm.cardType)
    if (existingSameType) {
      setNewCardError(t(userCardsLang, 'cardLimitReached').replace('{cardType}', newCardForm.cardType))
      return
    }

    const fee = newCardForm.cardType === 'Premium' ? 19 : (newCardForm.cardType === 'Elite' ? 9 : 0)

    if (fee > 0 && newCardForm.paymentMethod === 'balance') {
      const sourceCard = cards.find(c => c.id === newCardForm.sourceCardId)
      if (!sourceCard || sourceCard.balance < fee) {
        setNewCardError(t(userCardsLang, 'insufficientFunds').replace('{fee}', fee))
        return
      }
    }

    if (fee > 0 && newCardForm.paymentMethod === 'stripe') {
      setShowStripeMock(true)
      return
    }

    submitCardOrder()
  }

  const submitCardOrder = async () => {
    const fee = newCardForm.cardType === 'Premium' ? 19 : (newCardForm.cardType === 'Elite' ? 9 : 0)
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
      let errorMsg = err.message
      if (errorMsg === 'This card is blocked and cannot be used for payment.') {
        errorMsg = t(userCardsLang, 'cardBlockedError')
      }
      setNewCardError(errorMsg)
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

  const handleInternalTransferSubmit = async (e) => {
    e.preventDefault()
    if (!internalTransferForm.sourceCardId || !internalTransferForm.destCardId || !internalTransferForm.amount) return
    if (internalTransferForm.sourceCardId === internalTransferForm.destCardId) {
      setInternalTransferError(t(userCardsLang, 'sameCardError'))
      return
    }

    setInternalTransferStatus('loading')
    setInternalTransferError('')

    try {
      const destCard = cards.find(c => c.id.toString() === internalTransferForm.destCardId)

      const res = await fetch(`${API_BASE_URL}/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: internalTransferForm.sourceCardId,
          providerName: 'Internal Transfer',
          categoryName: 'Transfer',
          recipientAccount: destCard ? destCard.cardNumber : '',
          amount: parseFloat(internalTransferForm.amount)
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || t(userCardsLang, 'transferError'))
      }

      setInternalTransferStatus('success')
      fetchCards()
      setTimeout(() => {
        setShowInternalTransferModal(false)
        setInternalTransferStatus('idle')
        setInternalTransferForm({ sourceCardId: '', destCardId: '', amount: '' })
      }, 2000)
    } catch (err) {
      setInternalTransferError(err.message)
      setInternalTransferStatus('idle')
    }
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
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
                <img src={cardImages[card.cardType][card.network] || cardImages['Standard']['Mastercard']} alt={card.cardType} className="card-image" />
              </div>
              <div className="card-details">
                <div className="card-info-header">
                  <h2>{card.cardType} Card</h2>
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
            <div className="cashback-offer" key={item.titleKey}>
              <strong>{item.rate}</strong>
              <div className="cashback-offer-info">
                <h4>{t(userCardsLang, item.titleKey)}</h4>
                <p>{t(userCardsLang, item.textKey)}</p>
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
              <form onSubmit={handleAcquireCard} className="modal-form">
                {newCardError && <div className="form-error" style={{ color: '#ff4d4f', marginBottom: '12px' }}>{newCardError}</div>}

                <div className="form-group">
                  <label data-lang-key="cardType">{t(userCardsLang, 'cardType')}</label>
                  <select
                    value={newCardForm.cardType}
                    onChange={e => setNewCardForm({ ...newCardForm, cardType: e.target.value })}
                  >
                    <option value="Standard">Standard (0.00 AZN / {t(userCardsLang, 'monthly', 'month')})</option>
                    <option value="Premium">Premium (19.00 AZN / {t(userCardsLang, 'monthly', 'month')})</option>
                    <option value="Elite">Elite (9.00 AZN / {t(userCardsLang, 'monthly', 'month')})</option>
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
                      <span data-lang-key="feePaymentBoxText">{t(userCardsLang, 'feePaymentBoxText')}</span> ({newCardForm.cardType === 'Premium' ? '19' : '9'} AZN):
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
                <button className="settings-action-btn danger" onClick={() => handleToggleBlock(selectedSettingsCard.id)}>
                  <img src={blockIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{selectedSettingsCard.status === 'Active' ? t(userCardsLang, 'blockPlasticCard') : t(userCardsLang, 'unblockPlasticCard')}</span>
                    <span className="btn-subtitle" data-lang-key="toggleCardStatus">{t(userCardsLang, 'toggleCardStatus')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => alert('Increase credit limit clicked')}>
                  <img src={limitIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'increaseLimit')}</span>
                    <span className="btn-subtitle">{t(userCardsLang, 'currentLimit')}</span>
                  </div>
                </button>

                <button className="settings-action-btn" onClick={() => alert('Limits clicked')}>
                  <img src={limitsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'limitsTitle')}</span>
                    <span className="btn-subtitle">{t(userCardsLang, 'limitsDesc')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => alert('Change PIN clicked')}>
                  <img src={pinIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'changePin')}</span>
                    <span className="btn-subtitle">{t(userCardsLang, 'pinDesc')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => alert('Security Settings clicked')}>
                  <img src={securityIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'securitySettings')}</span>
                    <span className="btn-subtitle">{t(userCardsLang, 'securityDesc')}</span>
                  </div>
                </button>

                <button className="settings-action-btn" onClick={() => alert('Statements clicked')}>
                  <img src={statementsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'statementsAndCerts')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => setShowAccountDetailsModal(true)}>
                  <img src={accountIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'accountDetailsTitle')}</span>
                    <span className="btn-subtitle">{t(userCardsLang, 'accountDetailsDesc')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTransferCard && (
        <div className="card-modal-overlay" onClick={() => setSelectedTransferCard(null)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'transferMoneyTitle')}</h2>
              <button className="close-btn" onClick={() => setSelectedTransferCard(null)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section">
                <h3>{t(userCardsLang, 'transferOptions')}</h3>
                <button className="settings-action-btn" onClick={() => {
                  setInternalTransferForm(prev => ({ ...prev, sourceCardId: selectedTransferCard.id.toString(), destCardId: '', amount: '' }))
                  setSelectedTransferCard(null)
                  setInternalTransferStatus('idle')
                  setInternalTransferError('')
                  setShowInternalTransferModal(true)
                }}>
                  <img src={transferMyIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'transferToMyAccounts')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => {
                  setSelectedTransferCard(null)
                  setShowUnavailableModal(true)
                }}>
                  <img src={transferAnyIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'transferToAnyBank')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => {
                  setSelectedTransferCard(null)
                  setShowUnavailableModal(true)
                }}>
                  <img src={transferForeignIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'transferToForeignBank')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInternalTransferModal && (
        <div className="card-modal-overlay" onClick={() => setShowInternalTransferModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'internalTransferTitle')}</h2>
              <button className="close-btn" onClick={() => setShowInternalTransferModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              {internalTransferStatus === 'success' ? (
                <div className="success-message" style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="success-icon" style={{ fontSize: '48px', color: '#00d2ff', marginBottom: '16px' }}>✓</div>
                  <p>{t(userCardsLang, 'transferSuccess')}</p>
                </div>
              ) : (
                <form onSubmit={handleInternalTransferSubmit} className="modal-form">
                  {internalTransferError && <div className="error-message" style={{ color: '#ff4d4d' }}>{internalTransferError}</div>}
                  <div className="form-group">
                    <label>{t(userCardsLang, 'sourceCard')}</label>
                    <select
                      value={internalTransferForm.sourceCardId}
                      onChange={e => setInternalTransferForm({ ...internalTransferForm, sourceCardId: e.target.value })}
                      required
                    >
                      <option value="" disabled>{t(userCardsLang, 'selectCard')}</option>
                      {cards.map(c => (
                        <option key={`src-${c.id}`} value={c.id}>{c.cardType} •••• {c.cardNumber.slice(-4)} ({Number(c.balance).toFixed(2)} AZN)</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t(userCardsLang, 'destCard')}</label>
                    <select
                      value={internalTransferForm.destCardId}
                      onChange={e => setInternalTransferForm({ ...internalTransferForm, destCardId: e.target.value })}
                      required
                    >
                      <option value="" disabled>{t(userCardsLang, 'selectCard')}</option>
                      {cards.map(c => (
                        <option key={`dst-${c.id}`} value={c.id}>{c.cardType} •••• {c.cardNumber.slice(-4)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t(userCardsLang, 'transferAmount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={internalTransferForm.amount}
                      onChange={e => setInternalTransferForm({ ...internalTransferForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="cards-page__button cards-page__button--primary"
                    disabled={internalTransferStatus === 'loading' || !internalTransferForm.sourceCardId || !internalTransferForm.destCardId || !internalTransferForm.amount}
                  >
                    {internalTransferStatus === 'loading' ? t(userCardsLang, 'submitting') : t(userCardsLang, 'transferBtn')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showUnavailableModal && (
        <div className="card-modal-overlay" onClick={() => setShowUnavailableModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'featureUnavailableTitle')}</h2>
              <button className="close-btn" onClick={() => setShowUnavailableModal(false)}>✕</button>
            </div>
            <div className="card-modal__content" style={{ textAlign: 'center', padding: '20px' }}>
              <p>{t(userCardsLang, 'featureUnavailableDesc')}</p>
            </div>
          </div>
        </div>
      )}

      {showAccountDetailsModal && selectedSettingsCard && (
        <div className="card-modal-overlay" onClick={() => setShowAccountDetailsModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'accountDetailsTitle')}</h2>
              <button className="close-btn" onClick={() => setShowAccountDetailsModal(false)}>✕</button>
            </div>
            <div className="card-modal__content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="detail-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                <span className="detail-label" style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{t(userCardsLang, 'ibanLabel')}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="detail-value" style={{ fontSize: '16px', fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all', paddingRight: '10px' }}>
                    {selectedSettingsCard.iban}
                  </span>
                  <button 
                    className="copy-btn" 
                    onClick={() => handleCopy(selectedSettingsCard.iban, 'iban')}
                    style={{ background: 'transparent', border: '1px solid #4a00e0', color: '#00d2ff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {copiedField === 'iban' ? t(userCardsLang, 'copiedBtn') : t(userCardsLang, 'copyBtn')}
                  </button>
                </div>
              </div>

              <div className="detail-item" style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                <span className="detail-label" style={{ color: '#aaa', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{t(userCardsLang, 'swiftLabel')}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="detail-value" style={{ fontSize: '16px', fontFamily: 'monospace', color: '#fff' }}>
                    {selectedSettingsCard.swift}
                  </span>
                  <button 
                    className="copy-btn" 
                    onClick={() => handleCopy(selectedSettingsCard.swift, 'swift')}
                    style={{ background: 'transparent', border: '1px solid #4a00e0', color: '#00d2ff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {copiedField === 'swift' ? t(userCardsLang, 'copiedBtn') : t(userCardsLang, 'copyBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStripeMock && (
        <div className="card-modal-overlay" onClick={() => setShowStripeMock(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'stripeMockTitle')}</h2>
              <button className="close-btn" onClick={() => setShowStripeMock(false)}>✕</button>
            </div>
            <div className="card-modal__content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p>{t(userCardsLang, 'stripeMockDesc').replace('{fee}', newCardForm.cardType === 'Premium' ? '19' : '9')}</p>
              <div className="form-group">
                <label>{t(userCardsLang, 'cardNumberField')}</label>
                <input type="text" className="cards-page__input" placeholder="0000 0000 0000 0000" />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t(userCardsLang, 'expiryField')}</label>
                  <input type="text" className="cards-page__input" placeholder="MM/YY" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>{t(userCardsLang, 'cvcField')}</label>
                  <input type="text" className="cards-page__input" placeholder="123" />
                </div>
              </div>
              <button
                className="cards-page__button cards-page__button--primary"
                onClick={() => {
                  setShowStripeMock(false)
                  submitCardOrder()
                }}
              >
                {t(userCardsLang, 'payNow')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cards
