import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminFooter.scss'

const AdminFooter = () => {
  const [contacts, setContacts] = useState({
    address: { value: '', url: '' },
    email: { value: '', url: '' },
    phone: { value: '', url: '' }
  })
  
  const [socials, setSocials] = useState({
    Facebook: { url: '' },
    X: { url: '' },
    LinkedIn: { url: '' },
    Instagram: { url: '' }
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/footer-settings`)
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      
      const newContacts = { ...contacts }
      const newSocials = { ...socials }

      data.forEach(item => {
        if (item.category === 'Contact' && newContacts[item.key] !== undefined) {
          newContacts[item.key] = { value: item.value || '', url: item.url || '' }
        } else if (item.category === 'Social' && newSocials[item.key] !== undefined) {
          newSocials[item.key] = { url: item.url || '' }
        }
      })

      setContacts(newContacts)
      setSocials(newSocials)
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleContactChange = (key, field, val) => {
    setContacts(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: val }
    }))
  }

  const handleSocialChange = (key, val) => {
    setSocials(prev => ({
      ...prev,
      [key]: { url: val }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const payload = []
    
    Object.keys(contacts).forEach(key => {
      payload.push({
        category: 'Contact',
        key,
        value: contacts[key].value,
        url: contacts[key].url
      })
    })

    Object.keys(socials).forEach(key => {
      payload.push({
        category: 'Social',
        key,
        value: key,
        url: socials[key].url
      })
    })

    try {
      const res = await fetch(`${API_BASE_URL}/admin/footer-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update settings')
      
      showMessage('Footer settings successfully updated!', 'success')
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) {
    return <div className="admin-loading">Loading settings...</div>
  }

  return (
    <div className="admin-footer-page">
      <div className="header">
        <h1>Footer Settings</h1>
        <button 
          className="save-btn" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-section">
        <h2>Contact Details</h2>
        
        <div className="field-group">
          <label>Address</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Display text (e.g. Baku, Azerbaijan)" 
              value={contacts.address.value} 
              onChange={e => handleContactChange('address', 'value', e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Map URL (e.g. https://maps.google.com/?q=Baku)" 
              value={contacts.address.url} 
              onChange={e => handleContactChange('address', 'url', e.target.value)} 
            />
          </div>
        </div>

        <div className="field-group">
          <label>Email</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Display text (e.g. support@neobank.az)" 
              value={contacts.email.value} 
              onChange={e => handleContactChange('email', 'value', e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Mailto URL (e.g. mailto:support@neobank.az)" 
              value={contacts.email.url} 
              onChange={e => handleContactChange('email', 'url', e.target.value)} 
            />
          </div>
        </div>

        <div className="field-group">
          <label>Phone</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Display text (e.g. +994 12 555 45 45)" 
              value={contacts.phone.value} 
              onChange={e => handleContactChange('phone', 'value', e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Tel URL (e.g. tel:+994125554545)" 
              value={contacts.phone.url} 
              onChange={e => handleContactChange('phone', 'url', e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Social Media Links</h2>
        
        <div className="field-group">
          <label>Facebook</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://facebook.com/..." 
              value={socials.Facebook.url} 
              onChange={e => handleSocialChange('Facebook', e.target.value)} 
            />
          </div>
        </div>

        <div className="field-group">
          <label>X (Twitter)</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://x.com/..." 
              value={socials.X.url} 
              onChange={e => handleSocialChange('X', e.target.value)} 
            />
          </div>
        </div>

        <div className="field-group">
          <label>LinkedIn</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://linkedin.com/in/..." 
              value={socials.LinkedIn.url} 
              onChange={e => handleSocialChange('LinkedIn', e.target.value)} 
            />
          </div>
        </div>

        <div className="field-group">
          <label>Instagram</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://instagram.com/..." 
              value={socials.Instagram.url} 
              onChange={e => handleSocialChange('Instagram', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFooter
