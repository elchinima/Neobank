import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminCashbacks.scss'

const adminFetch = (url, options = {}) => {
  const token = Cookies.get('neobank_token')
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  return fetch(url, { ...options, headers })
}

const AdminCashbacks = () => {
  const [cashbacks, setCashbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [selectedCashback, setSelectedCashback] = useState(null)
  
  const [formData, setFormData] = useState({
    titleEn: '', titleRu: '', titleAz: '',
    textEn: '', textRu: '', textAz: '',
    rate: 0,
    mccCodes: ''
  })
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCashbacks()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setDropdownUp(spaceBelow < 120)
    setActiveMenuId(activeMenuId === id ? null : id)
  }

  const loadCashbacks = async () => {
    try {
      setLoading(true)
      const res = await adminFetch(`${API_BASE_URL}/admin/cashbacks`)
      if (!res.ok) {
        const text = await res.text()
        if (text.includes('<!DOCTYPE') || text.includes('<!doctype')) {
           throw new Error('API Endpoint not available yet. Please restart the backend server.')
        }
        throw new Error('Failed to load cashbacks')
      }
      const data = await res.json()
      setCashbacks(data)
    } catch (err) {
      showMessage(err.message, 'error')
      setCashbacks([])
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleOpenModal = (cashback = null) => {
    if (cashback) {
      setSelectedCashback(cashback)
      setFormData({
        titleEn: cashback.titleEn || '', titleRu: cashback.titleRu || '', titleAz: cashback.titleAz || '',
        textEn: cashback.textEn || '', textRu: cashback.textRu || '', textAz: cashback.textAz || '',
        rate: cashback.rate || 0,
        mccCodes: (cashback.mccCodes || []).join(', ')
      })
    } else {
      setSelectedCashback(null)
      setFormData({
        titleEn: '', titleRu: '', titleAz: '',
        textEn: '', textRu: '', textAz: '',
        rate: 0,
        mccCodes: ''
      })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const mccList = formData.mccCodes.split(',').map(m => m.trim()).filter(m => m)
      const payload = {
        titleEn: formData.titleEn, titleRu: formData.titleRu, titleAz: formData.titleAz,
        textEn: formData.textEn, textRu: formData.textRu, textAz: formData.textAz,
        rate: parseFloat(formData.rate) || 0,
        mccCodes: mccList
      }

      const method = selectedCashback ? 'PUT' : 'POST'
      const url = selectedCashback 
        ? `${API_BASE_URL}/admin/cashbacks/${selectedCashback.id}`
        : `${API_BASE_URL}/admin/cashbacks`

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to save cashback')

      showMessage('Cashback saved successfully!', 'success')
      setModalOpen(false)
      loadCashbacks()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (cashback) => {
    setSelectedCashback(cashback)
    setConfirmDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedCashback) return
    setSaving(true)
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/cashbacks/${selectedCashback.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete cashback')
      
      showMessage('Cashback deleted successfully!', 'success')
      setConfirmDeleteOpen(false)
      loadCashbacks()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredCashbacks = cashbacks.filter(c => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      (c.titleEn || '').toLowerCase().includes(lowerSearch) ||
      (c.mccCodes || []).some(m => m.toLowerCase().includes(lowerSearch))
    );
  });

  return (
    <div className="admin-cb">
      <header className="admin-cb__header">
        <div>
          <span className="admin-cb__eyebrow">Finance</span>
          <h1>Cashback Categories</h1>
        </div>
        <div className="admin-cb__actions">
          <div className="admin-cb__search">
            <label htmlFor="admin-cb-search">Search</label>
            <input
              id="admin-cb-search"
              type="search"
              placeholder="Search by title or MCC"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput)
              }}
            />
          </div>
          <button 
            type="button" 
            className="admin-cb__add-btn" 
            onClick={() => setSearch(searchInput)}
          >
            Search
          </button>
          <button className="admin-cb__add-btn" onClick={() => handleOpenModal()}>
            + Add Category
          </button>
        </div>
      </header>

      {message && (
        <div className={`admin-cb__message ${message.type}`}>
          {message.text}
        </div>
      )}

      <section className="admin-cb__table-card">
        <div className="admin-cb__table-wrap">
          {loading ? (
            <div className="admin-cb__empty">Loading cashbacks...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Rate (%)</th>
                  <th>Total Earned</th>
                  <th>MCC Codes</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCashbacks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-cb__empty">No cashbacks found</td>
                  </tr>
                ) : (
                  filteredCashbacks.map(c => {
                    const mccList = c.mccCodes || [];
                    const firstMcc = mccList[0];
                    const extraCount = mccList.length - 1;
                    return (
                      <tr key={c.id}>
                        <td><strong>{c.titleEn}</strong></td>
                        <td><strong>{c.rate}%</strong></td>
                        <td>{Number(c.totalEarned || 0).toFixed(2)} ₼</td>
                        <td>
                          <div className="mcc-tags">
                            {firstMcc && <span className="mcc-tag">{firstMcc}</span>}
                            {extraCount > 0 && <span className="mcc-tag extra">+{extraCount}</span>}
                          </div>
                        </td>
                        <td className="admin-cb__actions-cell">
                          <div className="admin-cb__menu-container">
                            <button 
                              className="admin-cb__dots" 
                              type="button" 
                              onClick={(e) => toggleMenu(e, c.id)}
                            >
                              <span />
                              <span />
                              <span />
                            </button>
                            
                            {activeMenuId === c.id && (
                              <div className={`admin-cb__dropdown ${dropdownUp ? 'admin-cb__dropdown--up' : ''}`}>
                                <button onClick={() => { setActiveMenuId(null); handleOpenModal(c); }}>Edit</button>
                                <button className="danger" onClick={() => { setActiveMenuId(null); confirmDelete(c); }}>Delete</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modalOpen && (
        <div className="admin-cb-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-cb-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-cb-modal__header">
              <h2>{selectedCashback ? 'Edit Cashback Category' : 'Create Cashback Category'}</h2>
              <button className="admin-cb-modal__close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <div className="admin-cb-modal__content">
              <div className="admin-cb-modal__form-row">
                <div className="admin-cb-modal__field">
                  <label>Title (EN)</label>
                  <input type="text" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                </div>
                <div className="admin-cb-modal__field">
                  <label>Title (RU)</label>
                  <input type="text" value={formData.titleRu} onChange={e => setFormData({...formData, titleRu: e.target.value})} />
                </div>
                <div className="admin-cb-modal__field">
                  <label>Title (AZ)</label>
                  <input type="text" value={formData.titleAz} onChange={e => setFormData({...formData, titleAz: e.target.value})} />
                </div>
              </div>

              <div className="admin-cb-modal__form-row">
                <div className="admin-cb-modal__field">
                  <label>Description (EN)</label>
                  <textarea value={formData.textEn} onChange={e => setFormData({...formData, textEn: e.target.value})}></textarea>
                </div>
                <div className="admin-cb-modal__field">
                  <label>Description (RU)</label>
                  <textarea value={formData.textRu} onChange={e => setFormData({...formData, textRu: e.target.value})}></textarea>
                </div>
                <div className="admin-cb-modal__field">
                  <label>Description (AZ)</label>
                  <textarea value={formData.textAz} onChange={e => setFormData({...formData, textAz: e.target.value})}></textarea>
                </div>
              </div>

              <div className="admin-cb-modal__form-row">
                <div className="admin-cb-modal__field">
                  <label>Rate (%)</label>
                  <input type="number" step="0.1" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} />
                </div>
                <div className="admin-cb-modal__field">
                  <label>MCC Codes</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 001, 1234, 56789" 
                    value={formData.mccCodes} 
                    onChange={e => setFormData({...formData, mccCodes: e.target.value})}
                    style={
                      formData.mccCodes && !/^(\s*\d{3,5}\s*(,\s*\d{3,5}\s*)*)?$/.test(formData.mccCodes)
                        ? { borderColor: '#ff3b30' }
                        : {}
                    }
                  />
                  {formData.mccCodes && !/^(\s*\d{3,5}\s*(,\s*\d{3,5}\s*)*)?$/.test(formData.mccCodes) && (
                    <span style={{ color: '#ff3b30', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Invalid format. Use comma-separated 3-5 digit numbers.
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="admin-cb-modal__footer">
              <button className="cancel-btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={handleSave} 
                disabled={saving || (formData.mccCodes && !/^(\s*\d{3,5}\s*(,\s*\d{3,5}\s*)*)?$/.test(formData.mccCodes))}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="admin-cb-modal-overlay" onClick={() => setConfirmDeleteOpen(false)}>
          <div className="admin-cb-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-cb-modal__header">
              <h2>Confirm Delete</h2>
              <button className="admin-cb-modal__close" onClick={() => setConfirmDeleteOpen(false)}>&times;</button>
            </div>
            <div className="admin-cb-modal__content">
              <p style={{ color: '#fff' }}>Are you sure you want to delete this category?</p>
            </div>
            <div className="admin-cb-modal__footer">
              <button className="cancel-btn" onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
              <button className="delete-btn" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCashbacks
