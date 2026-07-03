import { useLogin } from './Login.js'
import { Link } from 'react-router-dom'
import logoMark from '../../../assets/logo/main_logo.png'
import './Login.scss'

const features = [
  {
    number: '01',
    title: 'Two-factor authentication',
    text: '2FA is enabled on every sensitive action to keep your account protected.',
  },
  {
    number: '02',
    title: 'Instant card control',
    text: 'Freeze your card, change limits, and manage settings in real time.',
  },
  {
    number: '03',
    title: '24/7 account access',
    text: 'View balances, transactions, and cashback rewards at any time, from anywhere.',
  },
]

function Login() {
  const {
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    errors,
    isSubmitting,
    serverError,
    handleSubmit,
  } = useLogin()

  return (
    <div className="auth-page">
      <nav className="auth-page__nav" aria-label="NeoBank navigation">
        <Link className="auth-page__brand" to="/" aria-label="NeoBank home">
          <span className="auth-page__brand-mark" aria-hidden="true">
            <img src={logoMark} alt="" />
          </span>
          <span className="auth-page__brand-name">NeoBank</span>
        </Link>

        <div className="auth-page__nav-links">
          <Link to="/">Home</Link>
          <Link to="/loans">Loans</Link>
          <Link to="/cashback">Cashback</Link>
          <Link to="/support">Support</Link>
        </div>

        <div className="auth-page__nav-actions">
          <Link to="/register" className="auth-page__button auth-page__button--ghost">
            Open account
          </Link>
        </div>
      </nav>

      <main className="auth-page__main">
        <div className="auth-page__split">
          <aside className="auth-page__panel-left" aria-hidden="true">
            <div className="auth-page__panel-left-inner">
              <p className="auth-page__eyebrow">Welcome back</p>
              <h2 className="auth-page__panel-heading">
                Your finances, always within reach.
              </h2>
              <p className="auth-page__panel-sub">
                Sign in to manage accounts, track cashback, view statements, and
                stay on top of every transaction — all in one place.
              </p>

              <div className="auth-page__features">
                {features.map((f) => (
                  <div className="auth-page__feature" key={f.number}>
                    <span className="auth-page__feature-num">{f.number}</span>
                    <div>
                      <strong>{f.title}</strong>
                      <p>{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="auth-page__form-section" aria-labelledby="login-heading">
            <div className="auth-page__card">
              <div className="auth-page__card-header">
                <p className="auth-page__eyebrow">NeoBank · Sign In</p>
                <h1 id="login-heading" className="auth-page__card-title">
                  Welcome back
                </h1>
                <p className="auth-page__card-sub">Enter your credentials to access your account</p>
              </div>

              {serverError && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>
                  {serverError}
                </div>
              )}

              <form className="auth-page__form" noValidate onSubmit={handleSubmit}>
                <div className={`auth-page__group${errors.email ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <span className="auth-page__error">{errors.email}</span>}
                </div>

                <div className={`auth-page__group${errors.password ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="login-password">Password</label>
                  <div className="auth-page__input-wrap">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-page__toggle-pw"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.password && <span className="auth-page__error">{errors.password}</span>}
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-page__button auth-page__button--primary auth-page__button--full"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="auth-page__divider">
                <span>Don't have an account?</span>
              </div>

              <Link
                to="/register"
                className="auth-page__button auth-page__button--ghost auth-page__button--full"
              >
                Create account
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Login