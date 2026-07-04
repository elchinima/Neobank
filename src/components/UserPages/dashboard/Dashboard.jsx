import { useState, useEffect } from 'react'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { dashboardLang } from './lang.js'
import './Dashboard.scss'
import shoppingBubbleIcon from '../../../assets/icons/User/shopping_bubble.svg'
import foodBubbleIcon from '../../../assets/icons/User/food_bubble.svg'
import transportBubbleIcon from '../../../assets/icons/User/transport_bubble.svg'
import entertainmentBubbleIcon from '../../../assets/icons/User/entertainment_bubble.svg'
import utilitiesBubbleIcon from '../../../assets/icons/User/utilities_bubble.svg'
import vatBubbleIcon from '../../../assets/icons/User/vat_bubble.svg'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

const Dashboard = () => {
  const { t } = useLanguage()
  const { token, user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('7d')
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    bonuses: { cashback: 0, vat: 0, total: 0 },
    categories: []
  })

  const [hoveredBar, setHoveredBar] = useState(null)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    setAnimateIn(true)
  }, [])

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/dashboard/summary?period=${activeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data) setDashboardData(data)
        })
        .catch(err => console.error(err))
    }
  }, [token, activeFilter])

  const categoryIcons = {
    Utilities: utilitiesBubbleIcon,
    Shopping: shoppingBubbleIcon,
    Food: foodBubbleIcon,
    Transport: transportBubbleIcon,
    Entertainment: entertainmentBubbleIcon
  }

  const categoryColors = ['#A020F0', '#F3C24A', '#00E5FF', '#FF2E93', '#059669', '#38F9D7']

  const processedCategories = dashboardData.categories && dashboardData.categories.length > 0
    ? dashboardData.categories.map((cat, idx) => ({
        ...cat,
        color: categoryColors[idx % categoryColors.length],
        icon: categoryIcons[cat.name] || shoppingBubbleIcon
      }))
    : [
        { name: 'Utilities', value: 0, color: '#059669', icon: utilitiesBubbleIcon },
        { name: 'Shopping', value: 0, color: '#A020F0', icon: shoppingBubbleIcon }
      ]

  const totalCatValue = processedCategories.reduce((acc, c) => acc + c.value, 0) || 1
  const r = 70
  const circ = 2 * Math.PI * r

  let accumulatedPercent = 0
  const doughnutSegments = processedCategories.map((cat) => {
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

  return (
    <div className={`dashboard-view ${animateIn ? 'dashboard-view--loaded' : ''}`}>
      <header className="dashboard-view__header">
        <div>
          <span className="dashboard-view__eyebrow" data-lang-key="welcome">{t(dashboardLang, 'welcome')}, {user?.firstName || 'User'}!</span>
          <h1 data-lang-key="dashboard">{t(dashboardLang, 'dashboard')}</h1>
        </div>

        <div className="dashboard-view__filters">
          <button
            className={`dashboard-view__filter-btn ${activeFilter === '24h' ? 'dashboard-view__filter-btn--active' : ''}`}
            onClick={() => { setActiveFilter('24h'); setHoveredBar(null); }}
            data-lang-key="period24h"
          >
            {t(dashboardLang, 'period24h')}
          </button>
          <button
            className={`dashboard-view__filter-btn ${activeFilter === '7d' ? 'dashboard-view__filter-btn--active' : ''}`}
            onClick={() => { setActiveFilter('7d'); setHoveredBar(null); }}
            data-lang-key="period7d"
          >
            {t(dashboardLang, 'period7d')}
          </button>
          <button
            className={`dashboard-view__filter-btn ${activeFilter === 'month' ? 'dashboard-view__filter-btn--active' : ''}`}
            onClick={() => { setActiveFilter('month'); setHoveredBar(null); }}
            data-lang-key="periodMonth"
          >
            {t(dashboardLang, 'periodMonth')}
          </button>
        </div>
      </header>

      <div className="dashboard-view__top-grid">
        <div className="dashboard-view__card dashboard-view__card--balance">
          <div className="dashboard-view__card-header">
            <span data-lang-key="totalBalance">{t(dashboardLang, 'totalBalance')}</span>
            <span className="dashboard-view__card-badge">Active Account</span>
          </div>
          <div className="dashboard-view__balance-amount">
            {Number(dashboardData.totalBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })} <small>AZN</small>
          </div>
          <div className="dashboard-view__balance-summary">
            <div className="dashboard-view__summary-item dashboard-view__summary-item--income">
              <span data-lang-key="income">{t(dashboardLang, 'income')}</span>
              <strong>+{Number(dashboardData.totalIncome).toLocaleString()} AZN</strong>
            </div>
            <div className="dashboard-view__summary-item dashboard-view__summary-item--expense">
              <span data-lang-key="expenses">{t(dashboardLang, 'expenses')}</span>
              <strong>-{Number(dashboardData.totalExpenses).toLocaleString()} AZN</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-view__card dashboard-view__card--bonuses">
          <div className="dashboard-view__card-header">
            <span data-lang-key="bonuses">{t(dashboardLang, 'bonuses')}</span>
            <span className="dashboard-view__card-badge dashboard-view__card-badge--gold">Loyalty</span>
          </div>

          <div className="dashboard-view__bonuses-content">
            <div className="dashboard-view__bonuses-main">
              <div className="dashboard-view__bonuses-amount">
                {Number(dashboardData.bonuses.total).toFixed(2)} <small>AZN</small>
              </div>
            </div>

            <div className="dashboard-view__bonuses-breakdown">
              <div className="dashboard-view__bonus-row">
                <div className="dashboard-view__bonus-info">
                  <span className="dashboard-view__bonus-icon"><img src={shoppingBubbleIcon} alt="Cashback" style={{width: '100%', height: '100%'}} /></span>
                  <div className="dashboard-view__bonus-text">
                    <strong data-lang-key="cashback">{t(dashboardLang, 'cashback')}</strong>
                  </div>
                </div>
                <div className="dashboard-view__bonus-value">
                  {Number(dashboardData.bonuses.cashback).toFixed(2)} <small>AZN</small>
                </div>
              </div>

              <div className="dashboard-view__bonus-row">
                <div className="dashboard-view__bonus-info">
                  <span className="dashboard-view__bonus-icon"><img src={vatBubbleIcon} alt="VAT Refund" style={{width: '100%', height: '100%'}} /></span>
                  <div className="dashboard-view__bonus-text">
                    <strong data-lang-key="vat">{t(dashboardLang, 'vat')}</strong>
                  </div>
                </div>
                <div className="dashboard-view__bonus-value">
                  {Number(dashboardData.bonuses.vat).toFixed(2)} <small>AZN</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-view__charts-grid">
        <section className="dashboard-view__chart-card" aria-labelledby="expenses-categories-title">
          <div className="dashboard-view__chart-header">
            <h2 id="expenses-categories-title" data-lang-key="expenses">{t(dashboardLang, 'expenses')}</h2>
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
                        transition: 'stroke-width 0.3s ease',
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
                  -{Number(dashboardData.totalExpenses).toLocaleString('en-US', { maximumFractionDigits: 2 })}
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
                      <span>{seg.percentage}%</span>
                    </div>

                    <div className="legend-item__amount">
                      -{Number(seg.value).toLocaleString()} <small>AZN</small>
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
