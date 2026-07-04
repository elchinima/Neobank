import { Link } from 'react-router-dom'
import { useAuth } from '../../app/context/AuthContext'
import { useLanguage } from '../../app/context/LanguageContext'
import { navbarLang } from '../UserPages/navbar.lang.js'
import './NavUserProfile.scss'

const NavUserProfile = ({ customUser }) => {
  const { user: contextUser } = useAuth()
  const { t } = useLanguage()
  const user = customUser || contextUser

  if (!user) return null

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'NB'
  const fallbackName = t(navbarLang, 'userFallback') || 'User'
  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || fallbackName

  return (
    <Link to="/user/dashboard" className="nav-user-profile" title={t(navbarLang, 'profileTooltip')}>
      <div className="nav-user-profile__avatar">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={displayName} className="nav-user-profile__img" />
        ) : (
          <span className="nav-user-profile__initials">{initials}</span>
        )}
      </div>
      <div className="nav-user-profile__details">
        <span className="nav-user-profile__name">{displayName}</span>
      </div>
    </Link>
  )
}

export default NavUserProfile
