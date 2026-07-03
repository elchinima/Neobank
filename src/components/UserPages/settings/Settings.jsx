import { useState } from 'react'
import './Settings.scss'
import securityIcon from '../../../assets/icons/User/settings/security.svg'
import accountIcon from '../../../assets/icons/User/settings/account.svg'
import pinIcon from '../../../assets/icons/User/settings/pin.svg'
import updateIcon from '../../../assets/icons/User/settings/update.svg'

const Settings = () => {
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [email, setEmail] = useState('elchin@example.com')
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Account Settings</h1>
      </div>

      <div className="settings-container">
        
        {/* Profile & Personal Info */}
        <div className="settings-card">
          <div className="card-title-row">
            <img src={accountIcon} className="card-title-icon" alt="" />
            <h2>Profile Details</h2>
          </div>
          
          <div className="profile-wrapper">
            <div className="avatar-box">
              <div className="avatar-circle">E</div>
              <button className="change-avatar-btn">Change Avatar</button>
            </div>
            
            <div className="profile-info-fields">
              <div className="field-group">
                <label>Full Name</label>
                <input type="text" value="Elchin Mammadov" readOnly className="settings-input readonly" />
              </div>

              <div className="field-group">
                <label>Email Address</label>
                <div className="input-with-button">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="settings-input"
                  />
                  <button className="save-btn">
                    <img src={updateIcon} className="btn-icon" alt="" />
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="settings-card">
          <div className="card-title-row">
            <img src={securityIcon} className="card-title-icon" alt="" />
            <h2>Security & Privacy</h2>
          </div>

          <div className="settings-list">
            
            {/* 2FA Row */}
            <div className="setting-row setting-row--toggle">
              <div className="row-text">
                <span className="row-title">Two-Factor Authentication (2FA)</span>
                <span className="row-desc">Require a verification code when logging in to protect your account.</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={twoFactorAuth} 
                  onChange={() => setTwoFactorAuth(!twoFactorAuth)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {/* Change Password Row */}
            <div className="setting-row">
              <div className="row-text">
                <span className="row-title">Password</span>
                <span className="row-desc">It's a good idea to use a strong password that you don't use elsewhere.</span>
              </div>
              <button 
                className="action-btn"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <img src={pinIcon} className="btn-icon" alt="" />
                Change Password
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="settings-modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal__header">
              <h2>Change Password</h2>
              <button className="close-btn" onClick={() => setIsPasswordModalOpen(false)}>✕</button>
            </div>

            <div className="settings-modal__content">
              <div className="field-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  placeholder="Enter current password"
                  value={password.current}
                  onChange={(e) => setPassword({...password, current: e.target.value})}
                  className="settings-input"
                />
              </div>

              <div className="field-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  placeholder="Enter new password"
                  value={password.new}
                  onChange={(e) => setPassword({...password, new: e.target.value})}
                  className="settings-input"
                />
              </div>

              <div className="field-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm new password"
                  value={password.confirm}
                  onChange={(e) => setPassword({...password, confirm: e.target.value})}
                  className="settings-input"
                />
              </div>
            </div>

            <div className="settings-modal__footer">
              <button className="modal-btn cancel" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </button>
              <button className="modal-btn save" onClick={() => setIsPasswordModalOpen(false)}>
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
