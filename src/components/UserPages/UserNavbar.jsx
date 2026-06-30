import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import logoMark from '../../assets/logo/main_logo.png'
import './UserNavbar.scss'

const UserNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <nav className="user-navbar" aria-label="Client navigation">
      <Link className="user-navbar__brand" to="/dashboard">
        <span className="user-navbar__brand-mark" aria-hidden="true">
          <img src={logoMark} alt="" />
        </span>
        <span className="user-navbar__brand-name">NeoBank</span>
      </Link>

      <div className={`user-navbar__nav-links ${mobileMenuOpen ? 'user-navbar__nav-links--open' : ''}`}>
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `user-navbar__link ${isActive ? 'user-navbar__link--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Home
        </NavLink>
        <NavLink 
          to="/dashboard" 
          end
          className={({ isActive }) => `user-navbar__link ${isActive ? 'user-navbar__link--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/dashboard/payments" 
          className={({ isActive }) => `user-navbar__link ${isActive ? 'user-navbar__link--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Payments
        </NavLink>
        <NavLink 
          to="/dashboard/history" 
          className={({ isActive }) => `user-navbar__link ${isActive ? 'user-navbar__link--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          History
        </NavLink>
        <NavLink 
          to="/dashboard/settings" 
          className={({ isActive }) => `user-navbar__link ${isActive ? 'user-navbar__link--active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          Settings
        </NavLink>
        
        <div className="user-navbar__mobile-profile">
          <div className="user-navbar__profile-info">
            <strong>Elchin I.</strong>
            <span>Premium Client</span>
          </div>
          <button className="user-navbar__button user-navbar__button--ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="user-navbar__nav-actions">
        <div className="user-navbar__profile">
          <div className="user-navbar__avatar">EI</div>
          <div className="user-navbar__profile-details">
            <strong>Elchin I.</strong>
            <span>Premium Client</span>
          </div>
        </div>
        <button className="user-navbar__button user-navbar__button--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <button 
        className="user-navbar__toggle" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-expanded={mobileMenuOpen}
      >
        <span className={`user-navbar__toggle-bar ${mobileMenuOpen ? 'user-navbar__toggle-bar--open' : ''}`} />
        <span className={`user-navbar__toggle-bar ${mobileMenuOpen ? 'user-navbar__toggle-bar--open' : ''}`} />
        <span className={`user-navbar__toggle-bar ${mobileMenuOpen ? 'user-navbar__toggle-bar--open' : ''}`} />
      </button>
    </nav>
  )
}

export default UserNavbar
