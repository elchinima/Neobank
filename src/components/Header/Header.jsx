import './Header.scss'

function Header({ title }) {
  return (
    <header className="header">
      <h1 className="header__title">{title}</h1>

      <div className="header__right">
        <button className="header__notification">🔔</button>

        <div className="header__user">
          <div className="header__user-avatar">ИИ</div>
          <div className="header__user-info">
            <span>Иван Иванов</span>
            <span>Premium</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header