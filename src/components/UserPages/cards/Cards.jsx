import React, { useState, useEffect } from 'react'
import './Cards.scss'
import standartCard from '../../../assets/images/standart_card_mc.png'
import premiumCard from '../../../assets/images/premium_card_mc.png'
import eliteCard from '../../../assets/images/elite_card_mc.png'

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

const mockCards = [
  {
    id: 1,
    type: 'Standard',
    number: '5123 4567 8901 1234',
    cvv: '123',
    holderName: 'ELCHIN MAMMADOV',
    balance: '1,250.00 ₼',
    expiry: '12/25',
    image: standartCard,
    status: 'Active'
  },
  {
    id: 2,
    type: 'Premium',
    number: '4231 5678 9012 3456',
    cvv: '456',
    holderName: 'ELCHIN MAMMADOV',
    balance: '8,430.50 ₼',
    expiry: '08/26',
    image: premiumCard,
    status: 'Active'
  },
  {
    id: 3,
    type: 'Elite',
    number: '5342 9012 3456 7890',
    cvv: '789',
    holderName: 'ELCHIN MAMMADOV',
    balance: '45,900.00 ₼',
    expiry: '01/28',
    image: eliteCard,
    status: 'Active'
  }
]

const categoryProgram = [
  {
    title: 'Every 5th metro or bus ride',
    rate: '100%',
    text: 'Calculated from the average fare across all five rides.',
    earned: 2.50,
  },
  {
    title: 'Supermarkets',
    rate: '5%',
    text: 'Everyday grocery spending earns the highest retail rate.',
    earned: 8.40,
  },
  {
    title: 'Pharmacies',
    rate: '3%',
    text: 'Health and pharmacy purchases are included automatically.',
    earned: 1.20,
  },
  {
    title: 'Fuel stations',
    rate: '3%',
    text: 'Cashback for regular car expenses and fuel payments.',
    earned: 4.50,
  },
  {
    title: 'Restaurants, cafes, sweets',
    rate: '2%',
    text: 'Dining, coffee, desserts, and similar food categories.',
    earned: 5.80,
  },
  {
    title: 'Clothing and shoes',
    rate: '2%',
    text: 'Fashion, footwear, and wardrobe essentials.',
    earned: 3.00,
  },
  {
    title: 'Trendyol and Temu',
    rate: '1%',
    text: 'Online marketplace purchases through popular platforms.',
    earned: 0.00,
  },
  {
    title: 'Other payments',
    rate: '0.1%',
    text: 'A base reward for payments outside the main categories.',
    earned: 0.15,
  },
]

const mockReceipts = [
  { id: 1, shop: 'Bravo Supermarket', amount: '45.80 ₼', vatRefund: '0.68 ₼', date: '01.07.2026', status: 'Approved' },
  { id: 2, shop: 'Araz Supermarket', amount: '12.40 ₼', vatRefund: '0.18 ₼', date: '30.06.2026', status: 'Approved' },
  { id: 3, shop: 'Baku Electronics', amount: '899.00 ₼', vatRefund: '13.48 ₼', date: '28.06.2026', status: 'Approved' },
  { id: 4, shop: 'Port Baku Mall', amount: '150.00 ₼', vatRefund: '2.25 ₼', date: '25.06.2026', status: 'Pending' },
]

const mockVatReceiptsHistory = [
  { id: 1, shop: 'Bravo Supermarket', amount: '45.80 ₼', vatRefund: '0.68 ₼', date: '01.07.2026', status: 'Approved' },
  { id: 2, shop: 'Araz Supermarket', amount: '12.40 ₼', vatRefund: '0.18 ₼', date: '30.06.2026', status: 'Approved' },
  { id: 3, shop: 'Baku Electronics', amount: '899.00 ₼', vatRefund: '13.48 ₼', date: '28.06.2026', status: 'Approved' },
  { id: 4, shop: 'Port Baku Mall', amount: '150.00 ₼', vatRefund: '2.25 ₼', date: '25.06.2026', status: 'Pending' },
  { id: 5, shop: 'Zara Baku', amount: '220.00 ₼', vatRefund: '3.30 ₼', date: '20.06.2026', status: 'Approved' },
  { id: 6, shop: 'Neptun Market', amount: '55.50 ₼', vatRefund: '0.83 ₼', date: '18.06.2026', status: 'Approved' },
  { id: 7, shop: 'Bazarstore', amount: '89.10 ₼', vatRefund: '1.34 ₼', date: '15.06.2026', status: 'Approved' },
  { id: 8, shop: 'Ali & Nino Bookstore', amount: '35.00 ₼', vatRefund: '0.53 ₼', date: '12.06.2026', status: 'Approved' },
]

const Cards = () => {
  const [activeCardId, setActiveCardId] = useState(mockCards[0].id)
  const [selectedSettingsCard, setSelectedSettingsCard] = useState(null)
  const [selectedTransferCard, setSelectedTransferCard] = useState(null)
  const [showVatModal, setShowVatModal] = useState(false)
  const [showLimits, setShowLimits] = useState(false)
  
  const totalEarned = categoryProgram.reduce((sum, item) => sum + item.earned, 0).toFixed(2);

  useEffect(() => {
    if (selectedSettingsCard || selectedTransferCard || showVatModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedSettingsCard, selectedTransferCard, showVatModal])

  return (
    <div className="user-cards-page">
      <div className="cards-header">
        <h1>My Cards</h1>
      </div>

      <div className="cards-grid">
        {mockCards.map(card => (
          <div
            key={card.id}
            className={`card-item ${activeCardId === card.id ? 'active' : ''}`}
            onClick={() => setActiveCardId(card.id)}
          >
            <div className="card-image-wrapper">
              <img src={card.image} alt={`${card.type} Card`} className="card-image" />
            </div>
            <div className="card-details">
              <div className="card-info-header">
                <h2>{card.type} Card</h2>
                <span className={`status ${card.status.toLowerCase()}`}>{card.status}</span>
              </div>
              <div className="card-balance">
                <span className="label">Available Balance</span>
                <span className="amount">{card.balance}</span>
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
                    e.stopPropagation(); // prevent card from becoming active if clicking button, or let it
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

      <div className="cards-vat-section">
        <div className="vat-section-header">
          <div className="vat-title-row">
            <img src={vatBubbleIcon} className="vat-section-icon" alt="" />
            <h2>ƏDV geri al (VAT Refund)</h2>
          </div>
          <div className="vat-actions-row">
            <div className="total-vat">
              <span>Total Refunded: </span>
              <strong>16.59 ₼</strong>
            </div>
            <button className="view-all-vat-btn" onClick={() => setShowVatModal(true)}>View All</button>
          </div>
        </div>
        <div className="vat-receipts">
          {mockReceipts.map((receipt) => (
            <div className="vat-receipt" key={receipt.id}>
              <div className="receipt-info">
                <h4>{receipt.shop}</h4>
                <p>Receipt Amount: {receipt.amount} • {receipt.date}</p>
              </div>
              <div className="receipt-status-refund">
                <span className="refund-amount">+{receipt.vatRefund}</span>
                <span className={`status ${receipt.status.toLowerCase()}`}>{receipt.status}</span>
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
        <button className="add-product-btn">
          <img src={addProductIcon} className="btn-svg-icon" alt="" />
          <span>Add new product</span>
        </button>
      </div>

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
                  <span className="value">{selectedSettingsCard.type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Number</span>
                  <span className="value">{selectedSettingsCard.number}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Expiry Date</span>
                  <span className="value">{selectedSettingsCard.expiry}</span>
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
                <button className="settings-action-btn danger">
                  <img src={blockIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Block Plastic Card</span>
                    <span className="btn-subtitle">You can always unblock it</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={limitIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Increase Credit Limit</span>
                    <span className="btn-subtitle">Current limit: 0 ₼</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={googlePayIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Set Up Google Pay</span>
                    <span className="btn-subtitle">Card added</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={cardDesignIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Card Design in Google Pay</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={limitsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Limits</span>
                    <span className="btn-subtitle">For transfers and cash withdrawal</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={pinIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Change PIN Code</span>
                    <span className="btn-subtitle">Card and app</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={securityIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Security Settings</span>
                    <span className="btn-subtitle">Payment settings</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={subscriptionsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Manage Subscriptions</span>
                    <span className="btn-subtitle">All services linked to the card</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={statementsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Statements & Certificates</span>
                  </div>
                </button>
                <button className="settings-action-btn">
                  <img src={accountIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Account Details</span>
                    <span className="btn-subtitle">Domestic and SWIFT</span>
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
              <h2>Transfer Money</h2>
              <button className="close-btn" onClick={() => setSelectedTransferCard(null)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section">
                <h3>Transfer Options</h3>
                <button className="settings-action-btn" onClick={() => alert('Transferring to my accounts...')}>
                  <img src={transferMyIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Transfer to my accounts</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => alert('Transferring to card of any bank...')}>
                  <img src={transferAnyIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Transfer to card of any bank</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => alert('Transferring to card of foreign bank...')}>
                  <img src={transferForeignIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">Transfer to card of foreign bank</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVatModal && (
        <div className="card-modal-overlay" onClick={() => setShowVatModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>ƏDV geri al History</h2>
              <button className="close-btn" onClick={() => setShowVatModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section">
                <h3>Receipt History</h3>
                <div className="modal-receipts-list">
                  {mockVatReceiptsHistory.map((receipt) => (
                    <div className="vat-receipt-modal-item" key={receipt.id}>
                      <div className="receipt-details">
                        <h4>{receipt.shop}</h4>
                        <span className="receipt-date">{receipt.date} • Amount: {receipt.amount}</span>
                      </div>
                      <div className="receipt-status-refund">
                        <span className="refund-amount">+{receipt.vatRefund}</span>
                        <span className={`status ${receipt.status.toLowerCase()}`}>{receipt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cards
