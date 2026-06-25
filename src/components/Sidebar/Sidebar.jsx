import { NavLink } from 'react-router-dom'
import './Sidebar.scss'

const navItems = [
  {
    section: 'Главное',
    items: [
      { path: '/dashboard', icon: '◻', label: 'Дашборд' },
      { path: '/accounts', icon: '🏦', label: 'Счета' },
      { path: '/transfers', icon: '↔', label: 'Переводы' },
    ]
  },
  {
    section: 'Продукты',
    items: [
      { path: '/dashboard/cards', icon: '💳', label: 'Карты' },
      { path: '/loans', icon: '📋', label: 'Кредиты' },
      { path: '/deposits', icon: '💰', label: 'Депозиты' },
      { path: '/cashback', icon: '🎁', label: 'Кэшбэк' },
      { path: '/subscriptions', icon: '⭐', label: 'Подписки' },
    ]
  },
  {
    section: 'Поддержка',
    items: [
      { path: '/dashboard/support', icon: '💬', label: 'Поддержка' },
    ]
  }
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="logo__icon">N</div>
        <span className="logo__name">NeoBank</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <p className="sidebar__section-title">{section.section}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__item${isActive ? ' active' : ''}`
                }
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <div className="sidebar__item">
          <span className="icon">🚪</span>
          Выйти
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
