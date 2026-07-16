import { Link } from 'react-router-dom'
import logoWithText from '../../../assets/logo/main_logo_with_text.png'
import aiAnimatedSvg from '../../../assets/icons/glowing_eyes_pair_animated.svg'
import './Atm.scss'

function Atm() {
  return (
    <div className="atm-page">
      <nav className="atm-nav">
        <Link to="/" className="atm-nav__logo">
          <img src={logoWithText} alt="Neobank Logo" />
        </Link>
        <div className="atm-nav__ai">
          <img src={aiAnimatedSvg} alt="AI Assistant" />
        </div>
      </nav>

      <main className="atm-main">
        <div className="atm-screen">
          <h1 className="atm-screen__title">Welcome to the ATM</h1>
          <p className="atm-screen__subtitle">Select an operation</p>
          
          <div className="atm-grid">
            <button className="atm-action-btn">
              <span className="atm-action-btn__icon">💸</span>
              <span className="atm-action-btn__text">Withdraw Cash</span>
            </button>
            <button className="atm-action-btn">
              <span className="atm-action-btn__icon">🔄</span>
              <span className="atm-action-btn__text">Transfers</span>
            </button>
            <button className="atm-action-btn">
              <span className="atm-action-btn__icon">📄</span>
              <span className="atm-action-btn__text">Documents</span>
            </button>
            <button className="atm-action-btn">
              <span className="atm-action-btn__icon">💱</span>
              <span className="atm-action-btn__text">Other Currency</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Atm
