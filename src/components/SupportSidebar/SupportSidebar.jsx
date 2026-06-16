import { NavLink } from 'react-router-dom'
import './SupportSidebar.scss'

const navItems = [
  {
    section: 'Рабочее место',
    items: [
      { path: '/support-panel', icon: '💬', label: 'Обращения' },
    ]
  }
]

function SupportSidebar() {
  return (
    <aside className="support-sidebar">
      <div className="support-sidebar__logo">
        <div className="logo__icon">S</div>
        <div className="logo__name">
          <span>NeoBank</span>
          <span>Support Panel</span>
        </div>
      </div>

      <nav className="support-sidebar__nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <p className="support-sidebar__section-title">{section.section}</p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/support-panel'}
                className={({ isActive }) =>
                  `support-sidebar__item${isActive ? ' active' : ''}`
                }
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="support-sidebar__bottom">
        <NavLink to="/dashboard" className="support-sidebar__item">
          <span className="icon">👤</span>
          Личный кабинет
        </NavLink>
        <div className="support-sidebar__item">
          <span className="icon">🚪</span>
          Выйти
        </div>
      </div>
    </aside>
  )
}

export default SupportSidebar
