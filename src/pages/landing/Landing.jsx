import { Link } from 'react-router-dom'
import './Landing.scss'

const features = [
  { icon: '💳', title: 'Виртуальные карты', desc: 'Создавайте карты мгновенно и управляйте ими онлайн без похода в банк' },
  { icon: '↔', title: 'Быстрые переводы', desc: 'Переводите деньги между счетами и другим пользователям за секунды' },
  { icon: '📈', title: 'Депозиты', desc: 'Открывайте депозиты с выгодными ставками и следите за начислениями' },
  { icon: '📋', title: 'Кредиты', desc: 'Подавайте заявку на кредит онлайн и получайте решение быстро' },
  { icon: '🎁', title: 'Кэшбэк', desc: 'Получайте кэшбэк за каждую покупку и копите бонусы' },
  { icon: '🔒', title: 'Безопасность', desc: 'Двухфакторная аутентификация и шифрование всех данных' },
]

function Landing() {
  return (
    <div className="landing">
      <nav className="landing__nav">
        <div className="logo">
          <div className="logo__icon">N</div>
          <span className="logo__name">NeoBank</span>
        </div>

        <div className="landing__nav-links">
          <a href="#features">Услуги</a>
          <a href="#about">О нас</a>
          <a href="#contact">Контакты</a>
        </div>

        <div className="landing__nav-actions">
          <Link to="/login" className="btn-outline-dark">Войти</Link>
          <Link to="/register" className="btn-primary">Открыть счёт</Link>
        </div>
      </nav>

      <section className="landing__hero">
        <div className="landing__hero-content">
          <h1>Банкинг нового <span>поколения</span></h1>
          <p>Управляйте финансами удобно и безопасно. Счета, карты, переводы и многое другое в одном месте.</p>
          <div className="landing__hero-actions">
            <Link to="/register" className="btn-primary">Начать бесплатно</Link>
            <Link to="/login" className="btn-outline">Войти в аккаунт</Link>
          </div>
        </div>

        <div className="landing__hero-card">
          <p className="landing__hero-card-label">Основной счёт</p>
          <p className="landing__hero-card-balance">₼ 12,450.00</p>
          <div className="landing__hero-card-chip"></div>
          <p className="landing__hero-card-number">**** **** **** 4231</p>
          <div className="landing__hero-card-footer">
            <span>NeoBank Premium</span>
            <strong>VISA</strong>
          </div>
        </div>
      </section>

      <section className="landing__features" id="features">
        <h2>Всё что нужно для управления финансами</h2>
        <div className="landing__features-grid">
          {features.map((f) => (
            <div className="landing__features-card" key={f.title}>
              <div className="landing__features-card-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__cta">
        <h2>Готовы начать?</h2>
        <p>Откройте счёт за несколько минут и получите доступ ко всем возможностям</p>
        <Link to="/register" className="btn-primary">Создать аккаунт</Link>
      </section>

      <footer className="landing__footer">
        <span>© 2026 NeoBank. Все права защищены.</span>
        <span>Elsim Studio</span>
      </footer>
    </div>
  )
}

export default Landing