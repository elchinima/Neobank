import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoMark from '../../assets/logo/main_logo.png'
import { useAuth } from '../../app/context/AuthContext'
import './UserNavbar.scss'

const UserNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/user/dashboard', label: 'Dashboard' },
    { to: '/user/cards', label: 'Cards' },
    { to: '/user/payments', label: 'Payments' },
    { to: '/user/history', label: 'History' },
    { to: '/user/settings', label: 'Settings' }
  ]

  const filteredLinks = navLinks.filter(link => {
    if (link.to === '/') {
      return currentPath !== '/'
    }
    return currentPath !== link.to
  })

  // Initials for avatar
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'NB'

  const fullName = user
    ? `${user.firstName} ${user.lastName?.[0] ? user.lastName[0] + '.' : ''}`
    : 'Client'

  return (
    <nav className="user-navbar" aria-label="Client navigation">
      <Link className="user-navbar__brand" to="/user/dashboard">
        <span className="user-navbar__brand-mark" aria-hidden="true">
          <img src={logoMark} alt="" />
        </span>
        <span className="user-navbar__brand-name">NeoBank</span>
      </Link>

      <div className="user-navbar__nav-links">
        {filteredLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="user-navbar__link"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="user-navbar__nav-actions">
        <div className="user-navbar__profile">
          <div className="user-navbar__avatar">{initials}</div>
          <div className="user-navbar__profile-details">
            <strong>{fullName}</strong>
            <span>{user?.email || 'User'}</span>
          </div>
        </div>
        <button className="user-navbar__button user-navbar__button--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default UserNavbar
