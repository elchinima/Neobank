import { useState, useEffect } from 'react'
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
  1: [{ id: 101, name: 'Azercell' }, { id: 102, name: 'Bakcell' }, { id: 103, name: 'Nar Mobile' }, { id: 104, name: 'Naxtel' }, { id: 105, name: 'Azerfon' }],
  2: [{ id: 201, name: 'Azərişıq' }, { id: 202, name: 'Azərsu' }, { id: 203, name: 'Azəriqaz' }, { id: 204, name: 'Azəristiliktəchizat' }, { id: 205, name: 'SOCAR Utilities' }, { id: 206, name: 'Lift Service' }],
  3: [{ id: 301, name: 'Kapital Bank' }, { id: 302, name: 'ABB' }, { id: 303, name: 'Pasha Bank' }, { id: 304, name: 'Leobank' }, { id: 305, name: 'Unibank' }, { id: 306, name: 'Rabitabank' }, { id: 307, name: 'Bank Respublika' }, { id: 308, name: 'Xalq Bank' }, { id: 309, name: 'AccessBank' }, { id: 310, name: 'Yelo Bank' }, { id: 311, name: 'Birbank' }, { id: 312, name: 'Bank of Baku' }],
  4: [{ id: 401, name: 'BakıKart' }, { id: 402, name: 'BakıKart Student' }, { id: 403, name: 'BakıKart Pensioner' }],
  5: [{ id: 501, name: 'ADY Express' }, { id: 502, name: 'AZAL' }, { id: 503, name: 'Buta Airways' }, { id: 504, name: 'BakuBus' }, { id: 505, name: 'Baku Metro' }],
  6: [{ id: 601, name: 'DYP Fines' }, { id: 602, name: 'Baku Parking Fines' }, { id: 603, name: 'Court Fines' }, { id: 604, name: 'Administrative Fines' }, { id: 605, name: 'Traffic Police Penalties' }],
  7: [{ id: 701, name: 'Asan Pay' }, { id: 702, name: 'Taxes.gov.az' }, { id: 703, name: 'State Duties' }, { id: 704, name: 'Customs Payments' }, { id: 705, name: 'Social Insurance (DSMF)' }, { id: 706, name: 'E-Gov Payments' }],
  8: [{ id: 801, name: 'Baktelecom' }, { id: 802, name: 'Aztelekom' }, { id: 803, name: 'KATV1 Internet' }, { id: 804, name: 'CityNet' }, { id: 805, name: 'Aile NET' }, { id: 806, name: 'Starnet' }, { id: 807, name: 'Connect Internet' }, { id: 808, name: 'Ultel' }, { id: 809, name: 'SazyNet' }, { id: 810, name: 'GlobalNet' }],
  9: [{ id: 901, name: 'KATV1' }, { id: 902, name: 'Aile TV' }, { id: 903, name: 'Connect TV' }, { id: 904, name: 'Nntv.az' }, { id: 905, name: 'CityNet TV' }],
  10: [{ id: 1001, name: 'Baktelecom Telephone' }, { id: 1002, name: 'Aztelekom Telephone' }, { id: 1003, name: 'Ultel Landline' }],
  11: [{ id: 1101, name: 'Pasha Sığorta' }, { id: 1102, name: 'Atəşgah Sığorta' }, { id: 1103, name: 'Qala Sığorta' }, { id: 1104, name: 'AXA Mbask' }, { id: 1105, name: 'AzSığorta' }, { id: 1106, name: 'Bakı Sığorta' }, { id: 1107, name: 'Mega Sığorta' }, { id: 1108, name: 'Xalq Sığorta' }],
  12: [{ id: 1201, name: 'Trendyol' }, { id: 1202, name: 'Umico' }, { id: 1203, name: 'Kontakt Home' }, { id: 1204, name: 'Irshad Electronics' }, { id: 1205, name: 'BakuElectronics' }, { id: 1206, name: 'Alibaba.com' }, { id: 1207, name: 'Wildberries AZ' }, { id: 1208, name: 'Sima.az' }],
  13: [{ id: 1301, name: 'Wolt' }, { id: 1302, name: 'Bolt Food' }, { id: 1303, name: '189 Delivery' }, { id: 1304, name: 'Bravo Supermarket' }, { id: 1305, name: 'Araz Supermarket' }, { id: 1306, name: 'Bazarstore' }, { id: 1307, name: 'Smarty.az' }],
  14: [{ id: 1401, name: 'Bina.az' }, { id: 1402, name: 'Turbo.az' }, { id: 1403, name: 'Tap.az' }, { id: 1404, name: 'Boss.az' }, { id: 1405, name: 'Lalafo.az' }, { id: 1406, name: 'Rabota.az' }],
  15: [{ id: 1501, name: 'Referans Polyclinic' }, { id: 1502, name: 'Saglam Aile' }, { id: 1503, name: 'MedEra Hospital' }, { id: 1504, name: 'Central Hospital' }, { id: 1505, name: 'Baku Health Center' }, { id: 1506, name: 'DentaLux' }, { id: 1507, name: 'Leyla Medical Center' }],
  16: [{ id: 1601, name: 'Park Cinema' }, { id: 1602, name: 'CinemaPlus' }, { id: 1603, name: 'iTicket.az' }, { id: 1604, name: 'Biletdavay.az' }, { id: 1605, name: 'Heydar Aliyev Center' }, { id: 1606, name: 'Baku Convention Center' }, { id: 1607, name: 'Spotify AZ' }, { id: 1608, name: 'YouTube Premium' }],
  17: [{ id: 1701, name: 'Topaz' }, { id: 1702, name: 'Misli' }, { id: 1703, name: 'Pin-Up' }, { id: 1704, name: 'MostBet' }, { id: 1705, name: '1xBet' }],
  18: [{ id: 1801, name: 'MilliÖN' }, { id: 1802, name: 'eManat' }, { id: 1803, name: 'M10' }, { id: 1804, name: 'Hesab.az' }, { id: 1805, name: 'Port All' }, { id: 1806, name: 'EasyPay' }],
  19: [{ id: 1901, name: 'DIM' }, { id: 1902, name: 'Təhsil Haqqı' }, { id: 1903, name: 'ADA University' }, { id: 1904, name: 'Baku State University' }, { id: 1905, name: 'Khazar University' }, { id: 1906, name: 'Baku Higher Oil School' }, { id: 1907, name: 'Azerbaijan Technical University' }],
  20: [{ id: 2001, name: 'Shahdag Hotel & Spa' }, { id: 2002, name: 'Boulevard Hotel' }, { id: 2003, name: 'Hilton Baku' }, { id: 2004, name: 'JW Marriott Absheron' }, { id: 2005, name: 'Four Seasons Baku' }, { id: 2006, name: 'Fairmont Baku' }, { id: 2007, name: 'Pullman Baku' }, { id: 2008, name: 'Intourist Hotel' }],
  21: [{ id: 2101, name: 'Bolt' }, { id: 2102, name: 'Uber AZ' }, { id: 2103, name: '189 Taxi' }, { id: 2104, name: 'BiTaksi' }, { id: 2105, name: 'London Taxi Baku' }, { id: 2106, name: 'YandexGo AZ' }],
  22: [{ id: 2201, name: 'AzParking' }, { id: 2202, name: 'Baku Parking' }, { id: 2203, name: 'Port Baku Parking' }, { id: 2204, name: '28 Mall Parking' }],
  23: [{ id: 2301, name: 'YASHAT Foundation' }, { id: 2302, name: 'Karabakh Revival Fund' }, { id: 2303, name: 'Heydar Aliyev Foundation' }, { id: 2304, name: 'IDEA Campaign' }, { id: 2305, name: 'Azerbaijan Red Crescent' }],
  24: [{ id: 2401, name: 'MIDA' }, { id: 2402, name: 'Housing Utilities' }, { id: 2403, name: 'Mənzil İstismar Sahəsi' }, { id: 2404, name: 'Elevator Service' }, { id: 2405, name: 'Condominium Payments' }],
  25: [{ id: 2501, name: 'Ziraat Bank POS' }, { id: 2502, name: 'Kapital Bank POS' }, { id: 2503, name: 'Unibank POS' }],
  26: [{ id: 2601, name: 'Pasha Capital' }, { id: 2602, name: 'AzFinance' }, { id: 2603, name: 'InvestAZ' }, { id: 2604, name: 'Kapital Securities' }],
  27: [{ id: 2701, name: 'Other Services' }]
}

const mockCards = [
  { id: 1, name: 'Premium Card', last4: '4567', balance: 1250.50 },
  { id: 2, name: 'Salary Card', last4: '8901', balance: 340.00 },
  { id: 3, name: 'Cashback Card', last4: '1234', balance: 80.20 }
]

const getPaymentFieldInfo = (categoryId) => {
  switch (categoryId) {
    case 1: return { label: 'Phone Number', placeholder: 'e.g. 501234567', type: 'tel', inputMode: 'numeric', maxLength: 9 }
    case 2: return { label: 'Subscriber Code', placeholder: 'Enter subscriber code...' }
    case 3: return { label: 'Account / Card Number', placeholder: 'Enter account or card number...' }
    case 4: return { label: 'Card Number', placeholder: 'Enter 16-digit card number...', type: 'tel', inputMode: 'numeric', maxLength: 16 }
    case 5: return { label: 'Ticket / PNR', placeholder: 'Enter ticket or PNR...' }
    case 6: return { label: 'Protocol Number', placeholder: 'Enter protocol number...' }
    case 7: return { label: 'FIN / Tax ID', placeholder: 'Enter FIN or Tax ID...' }
    case 8: return { label: 'Subscriber Code / Login', placeholder: 'Enter subscriber code...' }
    case 9: return { label: 'Smart Card Number', placeholder: 'Enter smart card number...' }
    case 10: return { label: 'Phone Number', placeholder: 'e.g. 123456789', type: 'tel', inputMode: 'numeric', maxLength: 9 }
    case 11: return { label: 'Policy Number', placeholder: 'Enter policy number...' }
    case 12: return { label: 'Order Number', placeholder: 'Enter order number...' }
    case 13: return { label: 'Order ID / Phone Number', placeholder: 'Enter order ID...' }
    case 14: return { label: 'Ad Number / ID', placeholder: 'Enter ad ID...' }
    case 15: return { label: 'Patient ID / Invoice Number', placeholder: 'Enter patient ID...' }
    case 16: return { label: 'Ticket Number / Account', placeholder: 'Enter ticket number...' }
    case 17: return { label: 'Game Account ID', placeholder: 'Enter account ID...' }
    case 19: return { label: 'Student ID', placeholder: 'Enter student ID...' }
    case 20: return { label: 'Booking Reference', placeholder: 'Enter booking reference...' }
    case 21: return { label: 'Phone Number', placeholder: 'Enter phone number...', type: 'tel', inputMode: 'numeric', maxLength: 9 }
    case 22: return { label: 'License Plate', placeholder: 'e.g. 99-AA-999' }
    case 24: return { label: 'Apartment / Code', placeholder: 'Enter code...' }
    case 25: return { label: 'Terminal ID', placeholder: 'Enter terminal ID...' }
    default: return { label: 'Account / Reference Number', placeholder: 'Enter details...' }
  }
}

const Payments = () => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ account: '', amount: '', cardId: mockCards[0].id })
  const [paymentStatus, setPaymentStatus] = useState('idle') // idle, loading, success

  useEffect(() => {
    if (selectedCategory) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedCategory])

  const filteredCategories = paymentCategories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="payments-page">
      <div className="payments-page__header">
        <h1>My Payments</h1>
        <button className="payments-page__all-btn">All &gt;</button>
      </div>

      <div className="payments-page__search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  setPaymentForm({ account: '', amount: '' });
                }}>←</button>
              ) : null}
              <h2>{selectedProvider ? (paymentStatus === 'success' ? 'Payment Successful' : selectedProvider.name) : `${selectedCategory.name} Providers`}</h2>
              <button className="close-btn" onClick={() => {
                setSelectedCategory(null);
                setSelectedProvider(null);
                setPaymentStatus('idle');
                setPaymentForm({ account: '', amount: '' });
              }}>✕</button>
            </div>
            <div className="payment-modal__content">
              {selectedProvider ? (
                <div className="payment-simulation">
                  {paymentStatus === 'idle' && (
                    <form className="payment-form" onSubmit={(e) => {
                      e.preventDefault();
                      if (!paymentForm.account || !paymentForm.amount) return;
                      setPaymentStatus('loading');
                      setTimeout(() => {
                        setPaymentStatus('success');
                      }, 1500);
                    }}>
                      <div className="form-group">
                        <label>Pay from Card</label>
                        <select
                          value={paymentForm.cardId}
                          onChange={e => setPaymentForm({ ...paymentForm, cardId: parseInt(e.target.value) })}
                          required
                        >
                          {mockCards.map(card => (
                            <option key={card.id} value={card.id}>
                              {card.name} (**** {card.last4}) - {card.balance.toFixed(2)} AZN
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{selectedCategory ? getPaymentFieldInfo(selectedCategory.id).label : 'Account / Subscriber Number'}</label>
                        <input
                          type={selectedCategory && getPaymentFieldInfo(selectedCategory.id).type ? getPaymentFieldInfo(selectedCategory.id).type : 'text'}
                          inputMode={selectedCategory && getPaymentFieldInfo(selectedCategory.id).inputMode ? getPaymentFieldInfo(selectedCategory.id).inputMode : 'text'}
                          maxLength={selectedCategory && getPaymentFieldInfo(selectedCategory.id).maxLength ? getPaymentFieldInfo(selectedCategory.id).maxLength : undefined}
                          placeholder={selectedCategory ? getPaymentFieldInfo(selectedCategory.id).placeholder : 'Enter details...'}
                          value={paymentForm.account}
                          onChange={e => {
                            let val = e.target.value;
                            const fieldInfo = getPaymentFieldInfo(selectedCategory?.id);
                            if (fieldInfo?.inputMode === 'numeric') {
                              val = val.replace(/\D/g, ''); // Remove non-digit characters
                            }
                            setPaymentForm({ ...paymentForm, account: val });
                          }}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Amount (AZN)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          placeholder="0.00"
                          value={paymentForm.amount}
                          onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          required
                        />
                      </div>
                      <button type="submit" className="pay-btn" disabled={!paymentForm.account || !paymentForm.amount}>
                        Pay {paymentForm.amount ? `${paymentForm.amount} AZN` : ''}
                      </button>
                    </form>
                  )}
                  {paymentStatus === 'loading' && (
                    <div className="payment-loading">
                      <div className="spinner"></div>
                      <p>Processing payment...</p>
                    </div>
                  )}
                  {paymentStatus === 'success' && (
                    <div className="payment-success">
                      <div className="success-icon">✓</div>
                      <h3>Payment Completed!</h3>
                      <p>Your payment of {paymentForm.amount} AZN to {selectedProvider.name} was successful.</p>
                      <button className="done-btn" onClick={() => {
                        setSelectedCategory(null);
                        setSelectedProvider(null);
                        setPaymentStatus('idle');
                        setPaymentForm({ account: '', amount: '' });
                      }}>Done</button>
                    </div>
                  )}
                </div>
              ) : (
                providersData[selectedCategory.id] ? (
                  <div className="provider-list">
                    {providersData[selectedCategory.id].map(provider => (
                      <div key={provider.id} className="provider-item" onClick={() => setSelectedProvider(provider)}>
                        <div className="provider-icon-placeholder" style={{ background: getAvatarColor(provider.id) }}>
                          {provider.name.charAt(0)}
                        </div>
                        <span>{provider.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-providers">No providers available for this category yet.</div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments
