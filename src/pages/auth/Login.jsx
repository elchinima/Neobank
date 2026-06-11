import { Link } from 'react-router-dom'
import './Login.scss'

function Login() {
  return (
    <div className="login">
      <div className="login__left">
        <div className="logo">
          <div className="logo__icon">N</div>
          <span className="logo__name">NeoBank</span>
        </div>
        <p className="tagline">
          Современный банкинг для тех, кто ценит удобство и безопасность
        </p>
      </div>

      <div className="login__right">
        <div className="login__form-box">
          <h2>Добро пожаловать</h2>
          <p>Войдите в свой аккаунт</p>

          <div className="login__group">
            <label>Email</label>
            <input type="email" placeholder="example@email.com" />
          </div>

          <div className="login__group">
            <label>Пароль</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button className="login__btn">Войти</button>

          <div className="login__footer">
            Нет аккаунта?
            <Link to="/register">Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login