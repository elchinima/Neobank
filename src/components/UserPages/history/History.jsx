import { useState, useMemo } from 'react'
import './History.scss'

import shoppingBubbleIcon from '../../../assets/icons/User/shopping_bubble.svg'
import foodBubbleIcon from '../../../assets/icons/User/food_bubble.svg'
import transportBubbleIcon from '../../../assets/icons/User/transport_bubble.svg'
import entertainmentBubbleIcon from '../../../assets/icons/User/entertainment_bubble.svg'
import utilitiesBubbleIcon from '../../../assets/icons/User/utilities_bubble.svg'
import mobileIcon from '../../../assets/icons/User/payments/mobile.svg'
import bankIcon from '../../../assets/icons/User/payments/bank.svg'
import bakikartIcon from '../../../assets/icons/User/payments/bakikart.svg'

// MOCK DATA
const mockHistory = [
  {
    id: 'TXN-9823749823',
    title: 'Azercell Top-up',
    category: 'Mobile',
    type: 'payment',
    amount: -15.00,
    currency: 'AZN',
    date: '2026-07-02T14:30:00',
    status: 'completed',
    icon: mobileIcon,
    details: {
      account: '501234567',
      fee: 0,
      card: 'Premium Card (**** 4567)'
    }
  },
  {
    id: 'TXN-9823749824',
    title: 'Transfer to Farid M.',
    category: 'Transfer',
    type: 'transfer',
    amount: -50.00,
    currency: 'AZN',
    date: '2026-07-02T10:15:00',
    status: 'completed',
    icon: bankIcon,
    details: {
      account: 'Card **** 8899',
      fee: 0.50,
      card: 'Premium Card (**** 4567)'
    }
  },
  {
    id: 'TXN-9823749825',
    title: 'Salary Deposit',
    category: 'Income',
    type: 'deposit',
    amount: 1500.00,
    currency: 'AZN',
    date: '2026-07-01T09:00:00',
    status: 'completed',
    icon: bankIcon,
    details: {
      account: 'Tech Corp LLC',
      fee: 0,
      card: 'Salary Card (**** 8901)'
    }
  },
  {
    id: 'TXN-9823749826',
    title: 'Bravo Supermarket',
    category: 'Shopping',
    type: 'payment',
    amount: -124.40,
    currency: 'AZN',
    date: '2026-07-01T18:45:00',
    status: 'completed',
    icon: shoppingBubbleIcon,
    details: {
      account: 'POS-827364',
      fee: 0,
      card: 'Premium Card (**** 4567)',
      cashback: '2.48 AZN'
    }
  },
  {
    id: 'TXN-9823749827',
    title: 'Azərişıq',
    category: 'Utilities',
    type: 'payment',
    amount: -34.20,
    currency: 'AZN',
    date: '2026-06-30T12:20:00',
    status: 'completed',
    icon: utilitiesBubbleIcon,
    details: {
      account: 'Subscriber: 0123456789',
      fee: 0,
      card: 'Premium Card (**** 4567)'
    }
  },
  {
    id: 'TXN-9823749828',
    title: 'Netflix Subscription',
    category: 'Entertainment',
    type: 'payment',
    amount: -17.00,
    currency: 'AZN',
    date: '2026-06-29T20:00:00',
    status: 'completed',
    icon: entertainmentBubbleIcon,
    details: {
      account: 'netflix@example.com',
      fee: 0,
      card: 'Premium Card (**** 4567)'
    }
  },
  {
    id: 'TXN-9823749829',
    title: 'Refund from Zara',
    category: 'Shopping',
    type: 'deposit',
    amount: 89.90,
    currency: 'AZN',
    date: '2026-06-28T15:30:00',
    status: 'completed',
    icon: shoppingBubbleIcon,
    details: {
      account: 'Zara Returns',
      fee: 0,
      card: 'Premium Card (**** 4567)'
    }
  },
  {
    id: 'TXN-9823749830',
    title: 'Failed Transfer',
    category: 'Transfer',
    type: 'transfer',
    amount: -100.00,
    currency: 'AZN',
    date: '2026-06-27T11:10:00',
    status: 'failed',
    icon: bankIcon,
    details: {
      account: 'Card **** 1122',
      fee: 1.00,
      card: 'Premium Card (**** 4567)',
      error: 'Insufficient funds or block'
    }
  },
  {
    id: 'TXN-9823749831',
    title: 'BakıKart Top-up',
    category: 'Transport',
    type: 'payment',
    amount: -10.00,
    currency: 'AZN',
    date: '2026-06-26T08:15:00',
    status: 'completed',
    icon: bakikartIcon,
    details: {
      account: 'Card: 3948 2039 10',
      fee: 0,
      card: 'Cashback Card (**** 1234)'
    }
  }
];

const History = () => {
  const [filter, setFilter] = useState('all') // all, payment, transfer, deposit
  const [search, setSearch] = useState('')
  const [expandedTxn, setExpandedTxn] = useState(null)

  const filteredHistory = useMemo(() => {
    return mockHistory.filter(txn => {
      const matchesFilter = filter === 'all' || txn.type === filter
      const matchesSearch = txn.title.toLowerCase().includes(search.toLowerCase()) || 
                            txn.category.toLowerCase().includes(search.toLowerCase()) ||
                            txn.amount.toString().includes(search)
      return matchesFilter && matchesSearch
    })
  }, [filter, search])

  const groupedHistory = useMemo(() => {
    const groups = {}
    filteredHistory.forEach(txn => {
      const dateObj = new Date(txn.date)
      // Quick 'Today'/'Yesterday' check based on mock current date (July 2, 2026)
      const mockToday = new Date('2026-07-02')
      const mockYesterday = new Date('2026-07-01')
      
      let dateKey = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      if (dateObj.toDateString() === mockToday.toDateString()) dateKey = 'Today'
      else if (dateObj.toDateString() === mockYesterday.toDateString()) dateKey = 'Yesterday'

      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(txn)
    })
    return groups
  }, [filteredHistory])

  const toggleExpand = (id) => {
    setExpandedTxn(expandedTxn === id ? null : id)
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div className="history-page">
      <div className="history-page__header">
        <div>
          <h1>Operations History</h1>
          <p>Track your payments, transfers, and deposits</p>
        </div>
        
        <div className="history-page__filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'payment' ? 'active' : ''} onClick={() => setFilter('payment')}>Payments</button>
          <button className={filter === 'transfer' ? 'active' : ''} onClick={() => setFilter('transfer')}>Transfers</button>
          <button className={filter === 'deposit' ? 'active' : ''} onClick={() => setFilter('deposit')}>Income</button>
        </div>
      </div>

      <div className="history-page__search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          placeholder="Search by name, category, or amount..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="history-page__list">
        {Object.keys(groupedHistory).length === 0 ? (
          <div className="history-page__empty">
            <p>No operations found.</p>
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
                          {isFailed && <span className="history-item__status-badge">Failed</span>}
                        </div>
                        
                        <div className="history-item__chevron">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="history-item__details" onClick={(e) => e.stopPropagation()}>
                          <div className="details-grid">
                            <div className="detail-item">
                              <span className="detail-label">Transaction ID</span>
                              <span className="detail-value">{txn.id}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Status</span>
                              <span className={`detail-value status-${txn.status}`}>{txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Account / Target</span>
                              <span className="detail-value">{txn.details.account}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Payment Method</span>
                              <span className="detail-value">{txn.details.card}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Fee</span>
                              <span className="detail-value">{txn.details.fee > 0 ? `${txn.details.fee.toFixed(2)} ${txn.currency}` : 'No fee'}</span>
                            </div>
                            {txn.details.cashback && (
                              <div className="detail-item">
                                <span className="detail-label">Cashback Earned</span>
                                <span className="detail-value positive">+{txn.details.cashback}</span>
                              </div>
                            )}
                            {txn.details.error && (
                              <div className="detail-item">
                                <span className="detail-label">Error Reason</span>
                                <span className="detail-value error-text">{txn.details.error}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="details-actions">
                            <button className="btn-secondary">Download Receipt</button>
                            {!isFailed && txn.type !== 'deposit' && <button className="btn-primary">Repeat Payment</button>}
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

