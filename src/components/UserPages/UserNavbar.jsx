import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoMark from '../../assets/logo/main_logo.png'
import { useAuth } from '../../app/context/AuthContext'
import { useLanguage } from '../../app/context/LanguageContext'
import { navbarLang } from './navbar.lang.js'
import './UserNavbar.scss'
import './UserNavbar_Responsive.scss'

const UserNavbar = () => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', key: 'home' },
    { to: '/user/dashboard', key: 'dashboard' },
    { to: '/user/cards', key: 'cards' },
    { to: '/user/payments', key: 'payments' },
    { to: '/user/history', key: 'history' },
    { to: '/user/settings', key: 'settings' }
  ]

  const filteredLinks = navLinks.filter(link => {
    if (link.to === '/') {
      return currentPath !== '/'
    }
    return currentPath !== link.to
  })


  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'NB'

  const fullName = user
    ? `${user.firstName} ${user.lastName?.[0] ? user.lastName[0] + '.' : ''}`
    : 'Client'

  return (
    <>
      <nav className="user-navbar" aria-label="Client navigation">
      <Link className="user-navbar__brand" to="/user/dashboard">
        <span className="user-navbar__brand-mark" aria-hidden="true">
          <img src={logoMark} alt="NeoBank logo" />
        </span>
        <span className="user-navbar__brand-name">NeoBank</span>
      </Link>

      <div className="user-navbar__nav-links">
        {filteredLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="user-navbar__link"
            data-lang-key={link.key}
          >
            {t(navbarLang, link.key)}
          </Link>
        ))}
      </div>

      <div className="user-navbar__nav-actions">
        <Link to="/user/dashboard" className="user-navbar__profile" title={t(navbarLang, 'profileTooltip')}>
          <div className="user-navbar__avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>
          <div className="user-navbar__profile-details">
            <strong>{fullName}</strong>
            <span>{user?.email || 'User'}</span>
          </div>
        </Link>
        <button className="user-navbar__button user-navbar__button--ghost" onClick={() => setIsLogoutModalOpen(true)} data-lang-key="logout">
          {t(navbarLang, 'logout')}
        </button>
      </div>
    </nav>

      {isLogoutModalOpen && (
        <div className="user-navbar__modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="user-navbar__modal" onClick={(e) => e.stopPropagation()}>
            <h3 data-lang-key="logoutConfirmTitle">{t(navbarLang, 'logoutConfirmTitle')}</h3>
            <p data-lang-key="logoutConfirmText">{t(navbarLang, 'logoutConfirmText')}</p>
            <div className="user-navbar__modal-actions">
              <button onClick={() => setIsLogoutModalOpen(false)} className="user-navbar__button user-navbar__button--ghost" data-lang-key="cancel">
                {t(navbarLang, 'cancel')}
              </button>
              <button onClick={handleLogout} className="user-navbar__button user-navbar__button--danger" data-lang-key="logout">
                {t(navbarLang, 'logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserNavbar
