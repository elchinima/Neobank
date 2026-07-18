import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminFooter.scss'
import './AdminFooter_Responsive.scss'

const adminFetch = (url, options = {}) => {
  const token = Cookies.get('neobank_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};


const AdminFooter = () => {
  const [contacts, setContacts] = useState({
    Address: { value: '', url: '' },
    Email: { value: '', url: '' },
    Phone: { value: '', url: '' }
  })
  
  const [socials, setSocials] = useState({
    Facebook: { url: '' },
    X: { url: '' },
    LinkedIn: { url: '' },
    Instagram: { url: '' }
  })

  const [documents, setDocuments] = useState({
    userAgreement: { url: '' },
    rules: { url: '' },
    privacyPolicy: { url: '' },
    personalDataProcessing: { url: '' }
  })

  const [initialContacts, setInitialContacts] = useState(null)
  const [initialSocials, setInitialSocials] = useState(null)
  const [initialDocuments, setInitialDocuments] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/footer-settings`)
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      
      const newContacts = { ...contacts }
      const newSocials = { ...socials }
      const newDocuments = { ...documents }

      data.forEach(item => {
        const contactKey = Object.keys(newContacts).find(k => k.toLowerCase() === item.key.toLowerCase())
        const socialKey = Object.keys(newSocials).find(k => k.toLowerCase() === item.key.toLowerCase())
        const docKey = Object.keys(newDocuments).find(k => k.toLowerCase() === item.key.toLowerCase())

        if (item.category === 'Contact' && contactKey) {
          newContacts[contactKey] = { value: item.value || '', url: item.url || '' }
        } else if (item.category === 'Social' && socialKey) {
          newSocials[socialKey] = { url: item.url || '' }
        } else if (item.category === 'Document' && docKey) {
          newDocuments[docKey] = { url: item.url || '' }
        }
      })

      setContacts(newContacts)
      setSocials(newSocials)
      setDocuments(newDocuments)
      setInitialContacts(JSON.stringify(newContacts))
      setInitialSocials(JSON.stringify(newSocials))
      setInitialDocuments(JSON.stringify(newDocuments))
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

  const handleDocumentChange = (key, val) => {
    setDocuments(prev => ({
      ...prev,
      [key]: { url: val }
    }))
  }

  const hasChanges = () => {
    if (!initialContacts || !initialSocials || !initialDocuments) return false
    return JSON.stringify(contacts) !== initialContacts || 
           JSON.stringify(socials) !== initialSocials ||
           JSON.stringify(documents) !== initialDocuments
  }

  const handleSave = async () => {
    if (!hasChanges()) return

    setSaving(true)
    setMessage(null)

    const payload = []
    
    // Add only changed contacts
    const parsedInitialContacts = JSON.parse(initialContacts)
    Object.keys(contacts).forEach(key => {
      const current = contacts[key]
      const initial = parsedInitialContacts[key]
      if (current.value !== initial.value || current.url !== initial.url) {
        payload.push({
          category: 'Contact',
          key,
          value: current.value,
          url: current.url
        })
      }
    })

    // Add only changed socials
    const parsedInitialSocials = JSON.parse(initialSocials)
    Object.keys(socials).forEach(key => {
      const current = socials[key]
      const initial = parsedInitialSocials[key]
      if (current.url !== initial.url) {
        payload.push({
          category: 'Social',
          key,
          value: key,
          url: current.url
        })
      }
    })

    // Add only changed documents
    const parsedInitialDocuments = JSON.parse(initialDocuments)
    Object.keys(documents).forEach(key => {
      const current = documents[key]
      const initial = parsedInitialDocuments[key]
      if (current.url !== initial.url) {
        payload.push({
          category: 'Document',
          key,
          value: key,
          url: current.url
        })
      }
    })

    if (payload.length === 0) {
      setSaving(false)
      return
    }

    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/footer-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to update settings')
      
      setInitialContacts(JSON.stringify(contacts))
      setInitialSocials(JSON.stringify(socials))
      setInitialDocuments(JSON.stringify(documents))
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
    <div className="admin-footer">
      <div className="admin-footer__header">
        <div>
          <div className="admin-footer__eyebrow">Settings</div>
          <h1>Footer Settings</h1>
        </div>
        <button 
          className="admin-footer__save-btn" 
          onClick={handleSave} 
          disabled={saving || !hasChanges()}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`admin-footer__message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-footer__card">
        <h2>Contact Details</h2>
        
        <div className="admin-footer__field-group">
          <label>Address</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Display text (e.g. Baku, Azerbaijan)" 
              value={contacts.Address.value} 
              onChange={e => handleContactChange('Address', 'value', e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Map URL (e.g. https://maps.google.com/?q=Baku)" 
              value={contacts.Address.url} 
              onChange={e => handleContactChange('Address', 'url', e.target.value)} 
            />
          </div>
        </div>

        <div className="admin-footer__field-group">
          <label>Email</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Display text (e.g. support@neobank.az)" 
              value={contacts.Email.value} 
              onChange={e => handleContactChange('Email', 'value', e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Mailto URL (e.g. mailto:support@neobank.az)" 
              value={contacts.Email.url} 
              onChange={e => handleContactChange('Email', 'url', e.target.value)} 
            />
          </div>
        </div>

        <div className="admin-footer__field-group">
          <label>Phone</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="Display text (e.g. +994 12 555 45 45)" 
              value={contacts.Phone.value} 
              onChange={e => handleContactChange('Phone', 'value', e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Tel URL (e.g. tel:+994125554545)" 
              value={contacts.Phone.url} 
              onChange={e => handleContactChange('Phone', 'url', e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="admin-footer__card">
        <h2>Social Media Links</h2>
        
        <div className="admin-footer__field-group">
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

        <div className="admin-footer__field-group">
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

        <div className="admin-footer__field-group">
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

        <div className="admin-footer__field-group">
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

      <div className="admin-footer__card">
        <h2>Document Links</h2>
        
        <div className="admin-footer__field-group">
          <label>User Agreement</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://..." 
              value={documents.userAgreement.url} 
              onChange={e => handleDocumentChange('userAgreement', e.target.value)} 
            />
          </div>
        </div>

        <div className="admin-footer__field-group">
          <label>Rules</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://..." 
              value={documents.rules.url} 
              onChange={e => handleDocumentChange('rules', e.target.value)} 
            />
          </div>
        </div>

        <div className="admin-footer__field-group">
          <label>Privacy Policy</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://..." 
              value={documents.privacyPolicy.url} 
              onChange={e => handleDocumentChange('privacyPolicy', e.target.value)} 
            />
          </div>
        </div>

        <div className="admin-footer__field-group">
          <label>Personal Data Processing</label>
          <div className="input-row">
            <input 
              type="text" 
              placeholder="https://..." 
              value={documents.personalDataProcessing.url} 
              onChange={e => handleDocumentChange('personalDataProcessing', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFooter
