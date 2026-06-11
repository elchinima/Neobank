import { Link } from 'react-router-dom'
import './Register.scss'

function Register() {
  return (
    <div className="register">
      <div className="register__left">
        <div className="logo">
          <div className="logo__icon">N</div>
          <span className="logo__name">NeoBank</span>
        </div>
        <p className="tagline">
          Откройте счёт за несколько минут и управляйте финансами онлайн
        </p>
      </div>

      <div className="register__right">
        <div className="register__form-box">
          <h2>Создать аккаунт</h2>
          <p>Заполните данные для регистрации</p>

          <div className="register__row">
            <div className="register__group">
              <label>Имя</label>
              <input type="text" placeholder="Иван" />
            </div>
            <div className="register__group">
              <label>Фамилия</label>
              <input type="text" placeholder="Иванов" />
            </div>
          </div>

          <div className="register__group">
            <label>Email</label>
            <input type="email" placeholder="example@email.com" />
          </div>

          <div className="register__group">
            <label>Пароль</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <div className="register__group">
            <label>Подтверждение пароля</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button className="register__btn">Зарегистрироваться</button>

          <div className="register__footer">
            Уже есть аккаунт?
            <Link to="/login">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register