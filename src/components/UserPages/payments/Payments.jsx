import { useState } from 'react'
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

const Payments = () => {
  const [search, setSearch] = useState('')

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
          <div key={category.id} className="payment-category-item">
            <div className="payment-category-item__icon">
              <img src={category.icon} alt={category.name} />
            </div>
            <div className="payment-category-item__name">
              {category.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Payments
