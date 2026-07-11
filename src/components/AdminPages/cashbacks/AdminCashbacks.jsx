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

  useEffect(() => {
    loadCashbacks()
  }, [])

  const loadCashbacks = async () => {
    try {
      setLoading(true)
      const res = await adminFetch(`${API_BASE_URL}/admin/cashbacks`)
      if (!res.ok) throw new Error('Failed to load cashbacks')
      const data = await res.json()
      setCashbacks(data)
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
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
    }
  }

  return (
    <div className="admin-cashbacks">
      <div className="admin-cashbacks__header">
        <div>
          <div className="admin-cashbacks__eyebrow">Finance</div>
          <h1>Cashback Categories</h1>
        </div>
        <button className="admin-cashbacks__add-btn" onClick={() => handleOpenModal()}>
          + Add Category
        </button>
      </div>

      {message && (
        <div className={`admin-cashbacks__message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-cashbacks__content">
        {loading ? (
          <div className="admin-loading">Loading cashbacks...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title (EN)</th>
                  <th>Title (RU)</th>
                  <th>Title (AZ)</th>
                  <th>Rate (%)</th>
                  <th>MCC Codes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashbacks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">No cashbacks found</td>
                  </tr>
                ) : (
                  cashbacks.map(c => (
                    <tr key={c.id}>
                      <td>{c.titleEn}</td>
                      <td>{c.titleRu}</td>
                      <td>{c.titleAz}</td>
                      <td>{c.rate}%</td>
                      <td>
                        <div className="mcc-tags">
                          {(c.mccCodes || []).map(mcc => (
                            <span key={mcc} className="mcc-tag">{mcc}</span>
                          ))}
                        </div>
                      </td>
                      <td className="admin-table-actions">
                        <button onClick={() => handleOpenModal(c)}>Edit</button>
                        <button className="delete-btn" onClick={() => confirmDelete(c)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h2>{selectedCashback ? 'Edit Cashback Category' : 'Create Cashback Category'}</h2>
            <div className="admin-modal-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Title (EN)</label>
                  <input type="text" value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Title (RU)</label>
                  <input type="text" value={formData.titleRu} onChange={e => setFormData({...formData, titleRu: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Title (AZ)</label>
                  <input type="text" value={formData.titleAz} onChange={e => setFormData({...formData, titleAz: e.target.value})} />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Description (EN)</label>
                  <textarea value={formData.textEn} onChange={e => setFormData({...formData, textEn: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Description (RU)</label>
                  <textarea value={formData.textRu} onChange={e => setFormData({...formData, textRu: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label>Description (AZ)</label>
                  <textarea value={formData.textAz} onChange={e => setFormData({...formData, textAz: e.target.value})}></textarea>
                </div>
              </div>

              <div className="form-group-row two-cols">
                <div className="form-group">
                  <label>Rate (%)</label>
                  <input type="number" step="0.1" value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>MCC Codes (comma separated)</label>
                  <input type="text" placeholder="e.g. 001, 002, 003" value={formData.mccCodes} onChange={e => setFormData({...formData, mccCodes: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="admin-modal-actions">
              <button className="btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal delete-modal">
            <h2>Delete Category</h2>
            <p>Are you sure you want to delete this cashback category? This action cannot be undone.</p>
            <div className="admin-modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
              <button className="btn-delete" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCashbacks
