import { useRegister } from './Register.js'
import { Link } from 'react-router-dom'
import logoMark from '../../../assets/logo/main_logo.png'
import './Register.scss'

const features = [
  {
    number: '01',
    title: 'Open an account in 2 minutes',
    text: 'Complete registration online with no paperwork and no branch visit required.',
  },
  {
    number: '02',
    title: 'Up to 100% cashback',
    text: 'Earn automatic rewards at supermarkets, fuel stations, pharmacies, and more.',
  },
  {
    number: '03',
    title: 'Loans from 9.9% per year',
    text: 'Apply online and receive a pre-check decision in under 2 minutes.',
  },
]

function Register() {
  const {
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirm,
    setConfirm,
    errors,
    isSubmitting,
    serverError,
    handleSubmit,
  } = useRegister()

  return (
    <div className="auth-page auth-page--register">
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
          <Link to="/login" className="auth-page__button auth-page__button--ghost">
            Sign in
          </Link>
        </div>
      </nav>

      <main className="auth-page__main">
        <div className="auth-page__split">
          <aside className="auth-page__panel-left" aria-hidden="true">
            <div className="auth-page__panel-left-inner">
              <p className="auth-page__eyebrow">Open account</p>
              <h2 className="auth-page__panel-heading">
                Start your financial journey in minutes.
              </h2>
              <p className="auth-page__panel-sub">
                Join NeoBank — zero monthly fees, instant virtual card, automatic
                cashback, and loan decisions in under 2 minutes.
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

          <section className="auth-page__form-section" aria-labelledby="register-heading">
            <div className="auth-page__card">
              <div className="auth-page__card-header">
                <p className="auth-page__eyebrow">NeoBank · Create account</p>
                <h1 id="register-heading" className="auth-page__card-title">
                  Create account
                </h1>
                <p className="auth-page__card-sub">Fill in your details to get started</p>
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
                <div className="auth-page__row">
                  <div className={`auth-page__group${errors.firstName ? ' auth-page__group--error' : ''}`}>
                    <label htmlFor="reg-firstname">First name</label>
                    <input
                      id="reg-firstname"
                      type="text"
                      placeholder="Ivan"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    {errors.firstName && <span className="auth-page__error">{errors.firstName}</span>}
                  </div>
                  <div className={`auth-page__group${errors.lastName ? ' auth-page__group--error' : ''}`}>
                    <label htmlFor="reg-lastname">Last name</label>
                    <input
                      id="reg-lastname"
                      type="text"
                      placeholder="Ivanov"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    {errors.lastName && <span className="auth-page__error">{errors.lastName}</span>}
                  </div>
                </div>

                <div className={`auth-page__group${errors.email ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="reg-email">Email address</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="example@email.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <span className="auth-page__error">{errors.email}</span>}
                </div>

                <div className={`auth-page__group${errors.password ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="reg-password">Password</label>
                  <div className="auth-page__input-wrap">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
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

                <div className={`auth-page__group${errors.confirm ? ' auth-page__group--error' : ''}`}>
                  <label htmlFor="reg-confirm">Confirm password</label>
                  <div className="auth-page__input-wrap">
                    <input
                      id="reg-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-page__toggle-pw"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? '🙈' : '👁'}
                    </button>
                  </div>
                  {errors.confirm && <span className="auth-page__error">{errors.confirm}</span>}
                </div>

                <button
                  id="register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-page__button auth-page__button--primary auth-page__button--full"
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <div className="auth-page__divider">
                <span>Already have an account?</span>
              </div>

              <Link
                to="/login"
                className="auth-page__button auth-page__button--ghost auth-page__button--full"
              >
                Sign in
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default Register