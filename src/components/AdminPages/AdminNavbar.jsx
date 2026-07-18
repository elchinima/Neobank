import { Link, useLocation } from 'react-router-dom'
import logoMark from '../../assets/logo/main_logo.png'
import NavUserProfile from '../NavUserProfile/NavUserProfile'
import './AdminNavbar.scss'
import './AdminNavbar_Responsive.scss'

const AdminNavbar = () => {
  const location = useLocation()
  const currentPath = location.pathname

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/banner', label: 'Banner' },
    { to: '/admin/database', label: 'Database' },
    { to: '/admin/footer', label: 'Footer' },
    { to: '/admin/cashbacks', label: 'Cashbacks' },
    { to: '/admin/loans', label: 'Loans' }
  ]

  const filteredLinks = navLinks.filter((link) => currentPath !== link.to)

  return (
    <nav className="admin-navbar" aria-label="Admin navigation">
      <Link className="admin-navbar__brand" to="/admin/dashboard">
        <span className="admin-navbar__brand-mark" aria-hidden="true">
          <img src={logoMark} alt="NeoBank logo" />
        </span>
        <span className="admin-navbar__brand-name">NeoBank Admin</span>
      </Link>

      <div className="admin-navbar__nav-links">
        {filteredLinks.map((link) => (
          <Link key={link.to} to={link.to} className="admin-navbar__link">
            {link.label}
          </Link>
        ))}
      </div>

      <NavUserProfile />
    </nav>
  )
}

export default AdminNavbar
