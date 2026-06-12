import { NavLink } from 'react-router-dom'
import './AdminSidebar.scss'

const navItems = [
  {
    section: 'Обзор',
    items: [
      { path: '/admin', icon: '◻', label: 'Дашборд' },
    ]
  },
  {
    section: 'Управление',
    items: [
      { path: '/admin/users', icon: '👥', label: 'Пользователи' },
      { path: '/admin/accounts', icon: '🏦', label: 'Счета' },
      { path: '/admin/cards', icon: '💳', label: 'Карты' },
      { path: '/admin/loans', icon: '📋', label: 'Кредиты' },
      { path: '/admin/subscriptions', icon: '⭐', label: 'Подписки' },
    ]
  },
  {
    section: 'Поддержка',
    items: [
      { path: '/admin/support', icon: '💬', label: 'Обращения' },
    ]
  }
]

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__logo">
        <div className="logo__icon">A</div>
        <div className="logo__name">
          <span>NeoBank</span>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <p className="admin-sidebar__section-title">{section.section}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `admin-sidebar__item${isActive ? ' active' : ''}`
                }
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__bottom">
        <NavLink to="/dashboard" className="admin-sidebar__item">
          <span className="icon">👤</span>
          Личный кабинет
        </NavLink>
        <div className="admin-sidebar__item">
          <span className="icon">🚪</span>
          Выйти
        </div>
      </div>
    </aside>
  )
}

export default AdminSidebar