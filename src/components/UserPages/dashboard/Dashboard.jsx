import { useState, useEffect } from 'react'
import './Dashboard.scss'
import shoppingBubbleIcon from '../../../assets/icons/User/shopping_bubble.svg'
import foodBubbleIcon from '../../../assets/icons/User/food_bubble.svg'
import transportBubbleIcon from '../../../assets/icons/User/transport_bubble.svg'
import entertainmentBubbleIcon from '../../../assets/icons/User/entertainment_bubble.svg'
import utilitiesBubbleIcon from '../../../assets/icons/User/utilities_bubble.svg'
import vatBubbleIcon from '../../../assets/icons/User/vat_bubble.svg'

const filterData = {
  '24h': {
    totalExpenses: 284.50,
    totalIncome: 150.00,
    bonuses: {
      cashback: 4.20,
      vat: 1.80,
      total: 6.00
    },
    trend: [
      { label: '00:00', value: 12.00 },
      { label: '04:00', value: 5.00 },
      { label: '08:00', value: 95.50 },
      { label: '12:00', value: 42.00 },
      { label: '16:00', value: 105.00 },
      { label: '20:00', value: 25.00 }
    ],
    categories: [
      { name: 'Shopping', value: 105.00, color: '#A020F0', icon: shoppingBubbleIcon },
      { name: 'Food & Dining', value: 95.50, color: '#F3C24A', icon: foodBubbleIcon },
      { name: 'Transport', value: 42.00, color: '#00E5FF', icon: transportBubbleIcon },
      { name: 'Entertainment', value: 25.00, color: '#FF2E93', icon: entertainmentBubbleIcon },
      { name: 'Utilities', value: 17.00, color: '#059669', icon: utilitiesBubbleIcon }
    ]
  },
  '7d': {
    totalExpenses: 1420.00,
    totalIncome: 2100.00,
    bonuses: {
      cashback: 28.50,
      vat: 12.10,
      total: 40.60
    },
    trend: [
      { label: 'Mon', value: 180.00 },
      { label: 'Tue', value: 240.00 },
      { label: 'Wed', value: 150.00 },
      { label: 'Thu', value: 310.00 },
      { label: 'Fri', value: 120.00 },
      { label: 'Sat', value: 290.00 },
      { label: 'Sun', value: 130.00 }
    ],
    categories: [
      { name: 'Shopping', value: 550.00, color: '#A020F0', icon: shoppingBubbleIcon },
      { name: 'Food & Dining', value: 380.00, color: '#F3C24A', icon: foodBubbleIcon },
      { name: 'Entertainment', value: 200.00, color: '#FF2E93', icon: entertainmentBubbleIcon },
      { name: 'Transport', value: 170.00, color: '#00E5FF', icon: transportBubbleIcon },
      { name: 'Utilities', value: 120.00, color: '#059669', icon: utilitiesBubbleIcon }
    ]
  },
  'month': {
    totalExpenses: 4890.00,
    totalIncome: 8450.00,
    bonuses: {
      cashback: 112.40,
      vat: 48.60,
      total: 161.00
    },
    trend: [
      { label: 'Week 1', value: 1200.00 },
      { label: 'Week 2', value: 1540.00 },
      { label: 'Week 3', value: 980.00 },
      { label: 'Week 4', value: 1170.00 }
    ],
    categories: [
      { name: 'Shopping', value: 1850.00, color: '#A020F0', icon: shoppingBubbleIcon },
      { name: 'Food & Dining', value: 1420.00, color: '#F3C24A', icon: foodBubbleIcon },
      { name: 'Entertainment', value: 600.00, color: '#FF2E93', icon: entertainmentBubbleIcon },
      { name: 'Transport', value: 540.00, color: '#00E5FF', icon: transportBubbleIcon },
      { name: 'Utilities', value: 480.00, color: '#059669', icon: utilitiesBubbleIcon }
    ]
  }
}

const contacts = [
  { id: 1, name: 'Farid', initial: 'F', color: '#5B168F' },
  { id: 2, name: 'Leyla', initial: 'L', color: '#F3C24A' },
  { id: 3, name: 'Murad', initial: 'M', color: '#00E5FF' },
  { id: 4, name: 'Gunel', initial: 'G', color: '#FF2E93' }
]

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState('7d')
  const [accountBalance, setAccountBalance] = useState(12450.00)
  
  const [hoveredBar, setHoveredBar] = useState(null)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  const currentData = filterData[activeFilter]

  const [animateIn, setAnimateIn] = useState(false)
  useEffect(() => {
    setAnimateIn(true)
  }, [])

  const totalCatValue = currentData.categories.reduce((acc, c) => acc + c.value, 0)
  const r = 70
  const circ = 2 * Math.PI * r

  let accumulatedPercent = 0
  const doughnutSegments = currentData.categories.map((cat) => {
    const percentage = cat.value / totalCatValue
    const strokeLength = percentage * circ
    const gap = 16
    let adjustedLength = strokeLength - gap
    if (adjustedLength < 0.1) adjustedLength = 0.1

    const strokeOffset = -(accumulatedPercent * circ)
    const finalOffset = strokeOffset - (gap / 2)
    
    accumulatedPercent += percentage
    return {
      ...cat,
      strokeDasharray: `${adjustedLength} ${circ}`,
      strokeDashoffset: finalOffset,
      percentage: (percentage * 100).toFixed(1)
    }
  })

  const maxTrendValue = Math.max(...currentData.trend.map(t => t.value), 1)

  return (
    <div className={`dashboard-view ${animateIn ? 'dashboard-view--loaded' : ''}`}>
      <header className="dashboard-view__header">
        <div>
          <span className="dashboard-view__eyebrow">Welcome back, Elchin</span>
          <h1>Financial Dashboard</h1>
        </div>
        
        <div className="dashboard-view__filters">
          <button 
            className={`dashboard-view__filter-btn ${activeFilter === '24h' ? 'dashboard-view__filter-btn--active' : ''}`}
            onClick={() => { setActiveFilter('24h'); setHoveredBar(null); }}
          >
            24 Hours
          </button>
          <button 
            className={`dashboard-view__filter-btn ${activeFilter === '7d' ? 'dashboard-view__filter-btn--active' : ''}`}
            onClick={() => { setActiveFilter('7d'); setHoveredBar(null); }}
          >
            7 Days
          </button>
          <button 
            className={`dashboard-view__filter-btn ${activeFilter === 'month' ? 'dashboard-view__filter-btn--active' : ''}`}
            onClick={() => { setActiveFilter('month'); setHoveredBar(null); }}
          >
            This Month
          </button>
        </div>
      </header>

      <div className="dashboard-view__top-grid">
        <div className="dashboard-view__card dashboard-view__card--balance">
          <div className="dashboard-view__card-header">
            <span>Total Balance</span>
            <span className="dashboard-view__card-badge">Active Account</span>
          </div>
          <div className="dashboard-view__balance-amount">
            {accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <small>AZN</small>
          </div>
          <div className="dashboard-view__balance-summary">
            <div className="dashboard-view__summary-item dashboard-view__summary-item--income">
              <span>Income this period</span>
              <strong>+{currentData.totalIncome.toLocaleString()} AZN</strong>
            </div>
            <div className="dashboard-view__summary-item dashboard-view__summary-item--expense">
              <span>Expenses this period</span>
              <strong>-{currentData.totalExpenses.toLocaleString()} AZN</strong>
            </div>
          </div>
          
          <div className="dashboard-view__savings-goal">
            <div className="dashboard-view__goal-header">
              <span>Monthly Savings Goal</span>
              <strong>72%</strong>
            </div>
            <div className="dashboard-view__progress-track">
              <div className="dashboard-view__progress-bar" style={{ width: '72%' }} />
            </div>
          </div>
        </div>

        <div className="dashboard-view__card dashboard-view__card--bonuses">
          <div className="dashboard-view__card-header">
            <span>Earned Bonuses</span>
            <span className="dashboard-view__card-badge dashboard-view__card-badge--gold">Loyalty</span>
          </div>

          <div className="dashboard-view__bonuses-content">
            <div className="dashboard-view__bonuses-main">
              <div className="dashboard-view__bonuses-amount">
                {currentData.bonuses.total.toFixed(2)} <small>AZN</small>
              </div>
              <p className="dashboard-view__bonuses-subtitle">
                Accumulated bonuses
              </p>
            </div>

            <div className="dashboard-view__bonuses-breakdown">
              <div className="dashboard-view__bonus-row">
                <div className="dashboard-view__bonus-info">
                  <span className="dashboard-view__bonus-icon"><img src={shoppingBubbleIcon} alt="Shopping Cashback" style={{width: '100%', height: '100%'}} /></span>
                  <div className="dashboard-view__bonus-text">
                    <strong>Cashback</strong>
                    <span>Instant shopping return</span>
                  </div>
                </div>
                <div className="dashboard-view__bonus-value">
                  {currentData.bonuses.cashback.toFixed(2)} <small>AZN</small>
                </div>
              </div>

              <div className="dashboard-view__bonus-row">
                <div className="dashboard-view__bonus-info">
                  <span className="dashboard-view__bonus-icon"><img src={vatBubbleIcon} alt="VAT Refund" style={{width: '100%', height: '100%'}} /></span>
                  <div className="dashboard-view__bonus-text">
                    <strong>VAT Refund</strong>
                    <span>Tax refund on receipts</span>
                  </div>
                </div>
                <div className="dashboard-view__bonus-value">
                  {currentData.bonuses.vat.toFixed(2)} <small>AZN</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-view__charts-grid">
        <section className="dashboard-view__chart-card" aria-labelledby="expenses-trend-title">
          <div className="dashboard-view__chart-header">
            <h2 id="expenses-trend-title">Expenses Distribution</h2>
            <span className="trend-total">Total: -{currentData.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })} AZN</span>
          </div>

          <div className="trend-chart-container">
            <div className={`trend-chart-tooltip ${hoveredBar !== null ? 'trend-chart-tooltip--visible' : ''}`}>
              {hoveredBar !== null && (
                <>
                  <span className="trend-chart-tooltip__label">{currentData.trend[hoveredBar].label}</span>
                  <strong className="trend-chart-tooltip__value">-{currentData.trend[hoveredBar].value.toFixed(2)} AZN</strong>
                </>
              )}
            </div>

            <svg viewBox="0 0 500 220" width="100%" height="100%" className="trend-chart-svg">
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A020F0" stopOpacity="0.88" />
                  <stop offset="70%" stopColor="#5B168F" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#17121F" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFE28A" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#F3C24A" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#A020F0" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="gridLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255, 226, 138, 0.02)" />
                  <stop offset="50%" stopColor="rgba(255, 226, 138, 0.12)" />
                  <stop offset="100%" stopColor="rgba(255, 226, 138, 0.02)" />
                </linearGradient>
              </defs>

              <line x1="40" y1="30" x2="480" y2="30" stroke="url(#gridLineGradient)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="480" y2="80" stroke="url(#gridLineGradient)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="130" x2="480" y2="130" stroke="url(#gridLineGradient)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="#3B3343" strokeWidth="1" opacity="0.3" />

              <text x="30" y="34" className="chart-axis-text" textAnchor="end">{(maxTrendValue * 1.0).toFixed(0)}</text>
              <text x="30" y="84" className="chart-axis-text" textAnchor="end">{(maxTrendValue * 0.6).toFixed(0)}</text>
              <text x="30" y="134" className="chart-axis-text" textAnchor="end">{(maxTrendValue * 0.3).toFixed(0)}</text>
              <text x="30" y="184" className="chart-axis-text" textAnchor="end">0</text>

              {currentData.trend.map((point, index) => {
                const count = currentData.trend.length
                const chartWidth = 440
                const sectionWidth = chartWidth / count
                const barWidth = Math.min(sectionWidth * 0.45, 32)
                const x = 40 + (index * sectionWidth) + (sectionWidth / 2) - (barWidth / 2)
                
                const heightMax = 150
                const barHeight = point.value === 0 ? 3 : (point.value / maxTrendValue) * heightMax
                const y = 180 - barHeight

                const isHovered = hoveredBar === index

                return (
                  <g key={`${activeFilter}-${index}`}>
                    <rect
                      x={40 + (index * sectionWidth)}
                      y="15"
                      width={sectionWidth}
                      height="180"
                      fill="transparent"
                      cursor="pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    <rect
                      className="trend-bar"
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={isHovered ? 'url(#activeBarGradient)' : 'url(#barGradient)'}
                      pointerEvents="none"
                      style={{ 
                        transition: 'height 0.6s cubic-bezier(0.19, 1, 0.22, 1), y 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
                        transitionDelay: `${index * 30}ms`
                      }}
                    />

                    <text
                      x={x + (barWidth / 2)}
                      y="202"
                      className={`chart-axis-text chart-axis-text--x ${isHovered ? 'chart-axis-text--active' : ''}`}
                      textAnchor="middle"
                    >
                      {point.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </section>

        <section className="dashboard-view__chart-card" aria-labelledby="expenses-categories-title">
          <div className="dashboard-view__chart-header">
            <h2 id="expenses-categories-title">Categories Overview</h2>
            <span className="trend-total">Filters Active</span>
          </div>

          <div className="categories-chart-container">
            <div className="doughnut-wrapper">
              <svg viewBox="0 0 200 200" width="100%" height="100%" className="doughnut-svg">
                <circle
                  cx="100"
                  cy="100"
                  r={r}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="16"
                />

                {doughnutSegments.map((seg, index) => {
                  const isHovered = hoveredCategory === index
                  
                  return (
                    <circle
                      key={`${activeFilter}-cat-${index}`}
                      cx="100"
                      cy="100"
                      r={r}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? 22 : 16}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      transform="rotate(-90 100 100)"
                      strokeLinecap={seg.value > 0 ? "round" : "butt"}
                      style={{
                        transition: 'stroke-width 0.3s ease, stroke-dashoffset 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), stroke-dasharray 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoveredCategory(index)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  )
                })}
              </svg>

              <div className="doughnut-center-info">
                <span>Total spent</span>
                <strong>
                  -{totalCatValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  <small>AZN</small>
                </strong>
              </div>
            </div>

            <div className="categories-legend">
              {doughnutSegments.map((seg, index) => {
                const isHovered = hoveredCategory === index
                
                return (
                  <div 
                    key={seg.name}
                    className={`legend-item ${isHovered ? 'legend-item--hovered' : ''}`}
                    onMouseEnter={() => setHoveredCategory(index)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span className="legend-item__icon-wrap">
                      <span className="legend-item__icon"><img src={seg.icon} alt={seg.name} style={{width: '100%', height: '100%'}} /></span>
                    </span>
                    
                    <div className="legend-item__details">
                      <strong>{seg.name}</strong>
                      <span>{seg.percentage}% of expenses</span>
                    </div>

                    <div className="legend-item__amount">
                      -{seg.value.toLocaleString()} <small>AZN</small>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
