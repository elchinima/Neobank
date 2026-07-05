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

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const iconMap = {
  Utilities: utilitiesBubbleIcon,
  Mobile: mobileIcon,
  Shopping: shoppingBubbleIcon,
  Food: foodBubbleIcon,
  Transport: transportBubbleIcon,
  Entertainment: entertainmentBubbleIcon,
  Transfer: bankIcon,
  Income: bankIcon,
  CardFee: bankIcon
}

const History = () => {
  const { language, t } = useLanguage()
  const { token } = useAuth()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const locale = useMemo(() => {
    if (language === 'az') return 'az-Latn-AZ'
    if (language === 'ru') return 'ru-RU'
    return 'en-US'
  }, [language])
  const [expandedTxn, setExpandedTxn] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      setLoading(true)
      fetch(`${API_BASE_URL}/history`, {
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

  const formattedHistory = useMemo(() => {
    return historyList.map(item => {
      const isPositive = item.type === 'Credit'
      let title = item.description || item.category
      
      if (title && title.startsWith('Оплата 1-го месяца карты ')) {
        const cardName = title.replace('Оплата 1-го месяца карты ', '')
        title = `${t(historyLang, 'firstMonthFee')} ${cardName}`
      }

      return {
        id: item.id,
        title: title,
        category: item.category,
        type: item.type === 'Credit' ? 'deposit' : 'payment',
        amount: isPositive ? Number(item.amount) : -Number(item.amount),
        currency: 'AZN',
        date: item.createdAt,
        status: item.status.toLowerCase(),
        icon: iconMap[item.category] || bankIcon,
        details: {
          account: item.recipientAccount || 'System',
          fee: 0,
          card: `Card ID: ${item.cardId}`
        }
      }
    })
  }, [historyList, t])

  const filteredHistory = useMemo(() => {
    return formattedHistory.filter(txn => {
      const matchesFilter = filter === 'all' || txn.type === filter
      const matchesSearch = txn.title.toLowerCase().includes(search.toLowerCase()) ||
                            txn.category.toLowerCase().includes(search.toLowerCase()) ||
                            txn.amount.toString().includes(search)
      return matchesFilter && matchesSearch
    })
  }, [formattedHistory, filter, search])

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
                          <span>{txn.category} • {formatTime(txn.date)}</span>
                        </div>

                        <div className="history-item__amount-wrap">
                          <span className={`history-item__amount ${isPositive ? 'positive' : ''} ${isFailed ? 'strikethrough' : ''}`}>
                            {isPositive ? '+' : ''}{txn.amount.toFixed(2)} {txn.currency}
                          </span>
                        </div>

                        <div className="history-item__chevron">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="history-item__details" onClick={(e) => e.stopPropagation()}>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">{t(historyLang, 'transactionId')}</span>
                              <span className="detail-value">{txn.id}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">{t(historyLang, 'status')}</span>
                              <span className={`detail-value status-${txn.status}`}>{txn.status}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">{t(historyLang, 'accountTarget')}</span>
                              <span className="detail-value">{txn.details.account}</span>
                            </div>
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
