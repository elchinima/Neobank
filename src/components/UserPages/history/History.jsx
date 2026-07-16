import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { historyLang } from './lang.js'
import './History.scss'

import shoppingBubbleIcon from '../../../assets/icons/User/shopping_bubble.svg'
import foodBubbleIcon from '../../../assets/icons/User/food_bubble.svg'
import transportBubbleIcon from '../../../assets/icons/User/transport_bubble.svg'
import entertainmentBubbleIcon from '../../../assets/icons/User/entertainment_bubble.svg'
import utilitiesBubbleIcon from '../../../assets/icons/User/utilities_bubble.svg'
import mobileIcon from '../../../assets/icons/User/payments/mobile.svg'
import bankIcon from '../../../assets/icons/User/payments/bank.svg'
import insuranceIcon from '../../../assets/icons/User/payments/insurance.svg'
import educationIcon from '../../../assets/icons/User/payments/education.svg'
import medicalIcon from '../../../assets/icons/User/payments/medical.svg'
import housingIcon from '../../../assets/icons/User/payments/housing.svg'
import otherIcon from '../../../assets/icons/User/payments/other.svg'
import internetIcon from '../../../assets/icons/User/payments/internet.svg'
import taxiIcon from '../../../assets/icons/User/payments/taxi.svg'
import charityIcon from '../../../assets/icons/User/payments/charity.svg'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const iconMap = {
  Utilities: utilitiesBubbleIcon,
  Mobile: mobileIcon,
  'Mobile Operators': mobileIcon,
  Shopping: shoppingBubbleIcon,
  Food: foodBubbleIcon,
  Transport: transportBubbleIcon,
  Entertainment: entertainmentBubbleIcon,
  Transfer: bankIcon,
  Income: bankIcon,
  CardFee: bankIcon,
  LoanPayout: bankIcon,
  LoanPayment: bankIcon,
  DepositFunding: bankIcon,
  DepositWithdrawal: bankIcon,
  'Banking Services': bankIcon,
  Internet: internetIcon,
  Insurance: insuranceIcon,
  Education: educationIcon,
  'Medical Services': medicalIcon,
  'Housing Payments': housingIcon,
  Taxi: taxiIcon,
  Charity: charityIcon,
  Other: otherIcon
}

// Maps backend category string to lang key
const categoryLangKeyMap = {
  Utilities: 'catUtilities',
  Mobile: 'catMobile',
  'Mobile Operators': 'catMobileOperators',
  Shopping: 'catShopping',
  Food: 'catFood',
  Transport: 'catTransport',
  Entertainment: 'catEntertainment',
  Transfer: 'catTransfer',
  Income: 'catIncome',
  CardFee: 'catCardFee',
  LoanPayout: 'catLoanPayout',
  LoanPayment: 'catLoanPayment',
  DepositFunding: 'catDepositFunding',
  DepositWithdrawal: 'catDepositWithdrawal',
  'Banking Services': 'catBankingServices',
  'BakıKart': 'catBakiKart',
  Fines: 'catFines',
  'Government Payments': 'catGovernment',
  Internet: 'catInternet',
  'Cable TV': 'catCableTV',
  Telephone: 'catTelephone',
  Insurance: 'catInsurance',
  'E-commerce': 'catEcommerce',
  'Delivery Services': 'catDelivery',
  'Ads & Coupons': 'catAds',
  'Medical Services': 'catMedical',
  Betting: 'catBetting',
  'Agency Network': 'catAgency',
  Education: 'catEducation',
  Hotels: 'catHotels',
  Taxi: 'catTaxi',
  Parking: 'catParking',
  Charity: 'catCharity',
  'Housing Payments': 'catHousing',
  'POS Operators': 'catPOS',
  'Brokerage Services': 'catBrokerage',
  Other: 'catOther'
}

const statusLangKeyMap = {
  completed: 'statusCompleted',
  pending: 'statusPending',
  failed: 'statusFailed'
}

const History = () => {
  const { lang, t } = useLanguage()
  const { token, fetchWithAuth } = useAuth()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const locale = useMemo(() => {
    if (lang === 'az') return 'az-Latn-AZ'
    if (lang === 'ru') return 'ru-RU'
    return 'en-US'
  }, [lang])
  const [expandedTxn, setExpandedTxn] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      setLoading(true)
      fetchWithAuth(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setHistoryList(data)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [token])

  const translateCategory = (category) => {
    const langKey = categoryLangKeyMap[category]
    if (langKey) return t(historyLang, langKey)
    return category
  }

  const translateStatus = (status) => {
    const langKey = statusLangKeyMap[status]
    if (langKey) return t(historyLang, langKey)
    return status
  }

  const buildTitle = (item) => {
    const desc = item.description || ''
    const category = item.category

    // CardFee — extract card type name from description
    if (category === 'CardFee') {
      const cardNameMatch = desc.match(/(Premium|Elite|Standard)/i)
      const cardName = cardNameMatch ? cardNameMatch[0] : ''
      return cardName
        ? `${t(historyLang, 'catFirstMonthFee')} ${cardName}`
        : t(historyLang, 'catCardFee')
    }

    // Transfer — detect type from description
    if (category === 'Transfer') {
      if (desc.includes('IBAN')) return t(historyLang, 'catIbanTransfer')
      if (desc.includes('Internal') || desc.includes('Daxili') || desc.includes('Внутренний')) {
        return t(historyLang, 'catInternalTransfer')
      }
      if (desc.includes('NeoBank')) return t(historyLang, 'catNeoBankTransfer')
      return t(historyLang, 'catTransfer')
    }

    // Loan/Deposit — use category translation
    if (['LoanPayout', 'LoanPayment', 'DepositFunding', 'DepositWithdrawal'].includes(category)) {
      return translateCategory(category)
    }

    // Payment categories — use provider name from description if available
    if (desc.startsWith('Payment for ')) {
      const providerPart = desc.replace('Payment for ', '').split(' (')[0]
      return providerPart
    }

    // Fallback to translated category
    return translateCategory(category)
  }

  const formattedHistory = useMemo(() => {
    return historyList.map(item => {
      const isPositive = item.type === 'Credit'
      const title = buildTitle(item)
      const translatedCategory = translateCategory(item.category)

      // Build card info string
      let cardInfo = null
      if (item.cardType && item.cardLastFour) {
        cardInfo = `${item.cardType} ••${item.cardLastFour}`
      } else if (item.cardLastFour) {
        cardInfo = `••${item.cardLastFour}`
      }

      return {
        id: item.id,
        title: title,
        category: item.category,
        translatedCategory: translatedCategory,
        type: item.type === 'Credit' ? 'deposit' : 'payment',
        amount: isPositive ? Number(item.amount) : -Number(item.amount),
        currency: 'AZN',
        date: item.createdAt,
        status: item.status.toLowerCase(),
        icon: iconMap[item.category] || otherIcon,
        cardInfo: cardInfo,
        balanceAfter: item.balanceAfter,
        details: {
          account: item.recipientAccount || '—',
          description: item.description || '—'
        }
      }
    })
  }, [historyList, lang])

  const filteredHistory = useMemo(() => {
    return formattedHistory.filter(txn => {
      const txnDate = new Date(txn.date)
      const isSameDay = txnDate.getDate() === selectedDate.getDate() &&
                        txnDate.getMonth() === selectedDate.getMonth() &&
                        txnDate.getFullYear() === selectedDate.getFullYear()

      const matchesFilter = filter === 'all' || txn.type === filter
      const matchesSearch = txn.title.toLowerCase().includes(search.toLowerCase()) ||
                            txn.translatedCategory.toLowerCase().includes(search.toLowerCase()) ||
                            txn.amount.toString().includes(search) ||
                            (txn.cardInfo && txn.cardInfo.toLowerCase().includes(search.toLowerCase()))
      return isSameDay && matchesFilter && matchesSearch
    })
  }, [formattedHistory, filter, search, selectedDate])

  const groupedHistory = useMemo(() => {
    const groups = {}
    filteredHistory.forEach(txn => {
      const dateObj = new Date(txn.date)
      const dateKey = dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(txn)
    })
    return groups
  }, [filteredHistory, locale])

  const toggleExpand = (id) => {
    setExpandedTxn(expandedTxn === id ? null : id)
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  const handlePrevDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }

  const handleNextDay = () => {
    setSelectedDate(prev => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }

  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const formattedSelectedDate = selectedDate.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="history-page">
      <div className="history-page__header">
        <div>
          <h1 data-lang-key="title">{t(historyLang, 'title')}</h1>
          <p data-lang-key="subtitle">{t(historyLang, 'subtitle')}</p>
        </div>

        <div className="history-page__filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{t(historyLang, 'all')}</button>
          <button className={filter === 'payment' ? 'active' : ''} onClick={() => setFilter('payment')}>{t(historyLang, 'expenses')}</button>
          <button className={filter === 'deposit' ? 'active' : ''} onClick={() => setFilter('deposit')}>{t(historyLang, 'income')}</button>
        </div>
      </div>

      <div className="history-page__date-nav">
        <button onClick={handlePrevDay} className="history-page__date-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div className="history-page__current-date">
          {formattedSelectedDate}
          {isToday(selectedDate) && <span className="history-page__today-badge">{t(historyLang, 'today') || 'Today'}</span>}
        </div>
        <button onClick={handleNextDay} className="history-page__date-btn" disabled={isToday(selectedDate)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div className="history-page__search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder={t(historyLang, 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="history-page__list">
        {loading ? (
          <div className="history-page__empty"><p>{t(historyLang, 'loading')}</p></div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="history-page__empty">
            <p>{t(historyLang, 'noData')}</p>
          </div>
        ) : (
          Object.keys(groupedHistory).map(dateKey => (
            <div key={dateKey} className="history-group">
              <h3 className="history-group__date">{dateKey}</h3>
              <div className="history-group__items">
                {groupedHistory[dateKey].map(txn => {
                  const isExpanded = expandedTxn === txn.id
                  const isPositive = txn.amount > 0
                  const isFailed = txn.status === 'failed'

                  return (
                    <div key={txn.id} className={`history-item ${isExpanded ? 'expanded' : ''} ${isFailed ? 'failed' : ''}`} onClick={() => toggleExpand(txn.id)}>
                      <div className="history-item__main">
                        <div className="history-item__icon-wrapper">
                          <img src={txn.icon} alt={txn.category} />
                        </div>

                        <div className="history-item__info">
                          <h4>{txn.title}</h4>
                          <span className="history-item__meta">
                            {txn.translatedCategory} • {formatTime(txn.date)}
                          </span>
                          {txn.cardInfo && (
                            <span className="history-item__card-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                <line x1="1" y1="10" x2="23" y2="10"></line>
                              </svg>
                              {txn.cardInfo}
                            </span>
                          )}
                        </div>

                        <div className="history-item__amount-wrap">
                          <span className={`history-item__amount ${isPositive ? 'positive' : ''} ${isFailed ? 'strikethrough' : ''}`}>
                            {isPositive ? '+' : ''}{txn.amount.toFixed(2)} {txn.currency}
                          </span>
                          <span className={`history-item__status-badge status-${txn.status}`}>
                            {translateStatus(txn.status)}
                          </span>
                        </div>

                        <div className="history-item__chevron">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="history-item__details" onClick={(e) => e.stopPropagation()}>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">{t(historyLang, 'transactionId')}</span>
                              <span className="detail-value detail-value--id">{txn.id}</span>
                            </div>
                            <div className="detail-item status-item">
                              <span className="detail-label">{t(historyLang, 'status')}</span>
                              <span className={`detail-value status-${txn.status}`}>{translateStatus(txn.status)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">{t(historyLang, 'category')}</span>
                              <span className="detail-value">{txn.translatedCategory}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">{t(historyLang, 'accountTarget')}</span>
                              <span className="detail-value">{txn.details.account}</span>
                            </div>
                            {txn.balanceAfter != null && (
                              <div className="detail-item">
                                <span className="detail-label">{t(historyLang, 'balanceAfter') || 'Balance'}</span>
                                <span className="detail-value">{Number(txn.balanceAfter).toFixed(2)} AZN</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default History
