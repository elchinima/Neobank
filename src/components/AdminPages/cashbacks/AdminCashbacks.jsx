import Cookies from 'js-cookie'
import { useEffect, useState, useRef } from 'react'
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
  const [allMccs, setAllMccs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [mccModalOpen, setMccModalOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [selectedCashback, setSelectedCashback] = useState(null)
  
  const [formData, setFormData] = useState({
    titleEn: '', titleRu: '', titleAz: '',
    textEn: '', textRu: '', textAz: '',
    rate: 0,
    variant: 'A',
    mccCodes: []
  })
  
  const [mccForm, setMccForm] = useState({ code: '', description: '' })
  const [editingMccId, setEditingMccId] = useState(null)
  
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  
  const [mccSearchQuery, setMccSearchQuery] = useState('')
  const [mccDropdownOpen, setMccDropdownOpen] = useState(false)
  const [showAllMccs, setShowAllMccs] = useState(false)
  const mccDropdownRef = useRef(null)

  useEffect(() => {
    loadCashbacks()
    loadMccs()
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      setActiveMenuId(null)
      if (mccDropdownRef.current && !mccDropdownRef.current.contains(e.target)) {
        setMccDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const loadMccs = async () => {
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/mccs`)
      if (!res.ok) throw new Error('Failed to load MCCs')
      const data = await res.json()
      setAllMccs(data)
    } catch (err) {
      console.error(err)
      setAllMccs([])
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
        variant: cashback.variant || 'A',
        mccCodes: cashback.mccCodes || []
      })
    } else {
      setSelectedCashback(null)
      setFormData({
        titleEn: '', titleRu: '', titleAz: '',
        textEn: '', textRu: '', textAz: '',
        rate: 0,
        variant: 'A',
        mccCodes: []
      })
    }
    setMccSearchQuery('')
    setShowAllMccs(false)
    setModalOpen(true)
  }

  const handleOpenMccModal = () => {
    setMccForm({ code: '', description: '' })
    setMccModalOpen(true)
  }

  const handleSaveMcc = async () => {
    if (!mccForm.code.trim()) return showMessage('MCC Code is required', 'error')
    if (!/^\d{3,4}$/.test(mccForm.code.trim())) return showMessage('MCC Code must be a 3 or 4 digit number', 'error')
    if (mccForm.description.length > 100) return showMessage('Description is too long', 'error')
    
    setSaving(true)
    try {
      const isEditing = !!editingMccId
      const url = isEditing 
        ? `${API_BASE_URL}/admin/mccs/${editingMccId}` 
        : `${API_BASE_URL}/admin/mccs`
      
      const res = await adminFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mccForm)
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to save MCC')
      }
      
      showMessage(isEditing ? 'MCC updated successfully!' : 'MCC created successfully!', 'success')
      setEditingMccId(null)
      setMccForm({ code: '', description: '' })
      loadMccs()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMcc = async (id) => {
    if (!window.confirm("Are you sure you want to delete this MCC?")) return
    setSaving(true)
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/mccs/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete MCC')
      showMessage('MCC deleted successfully!', 'success')
      loadMccs()
    } catch (err) {
      showMessage(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEditMcc = (mcc) => {
    setEditingMccId(mcc.id)
    setMccForm({ code: mcc.code, description: mcc.description })
  }

  const cancelEditMcc = () => {
    setEditingMccId(null)
    setMccForm({ code: '', description: '' })
  }

  const handleAddMccToCategory = (mcc) => {
    if (formData.mccCodes.includes('All')) {
      showMessage('Remove "All" before selecting specific MCCs.', 'error')
      return
    }
    if (!formData.mccCodes.includes(mcc.code)) {
      // Check for duplicates across other categories
      const duplicateMccs = []
      cashbacks.forEach(cb => {
        if (selectedCashback && cb.id === selectedCashback.id) return
        const existingMccs = cb.mccCodes || []
        if (existingMccs.includes(mcc.code)) duplicateMccs.push(mcc.code)
      })
      if (duplicateMccs.length > 0) {
        showMessage(`MCC ${mcc.code} is already used in another category.`, 'error')
        return
      }

      const newMccCodes = [...formData.mccCodes, mcc.code]

      // Check if all available MCCs are now selected
      const usedMccs = new Set()
      cashbacks.forEach(cb => {
        if (selectedCashback && cb.id === selectedCashback.id) return
        const existingMccs = cb.mccCodes || []
        existingMccs.forEach(c => usedMccs.add(c))
      })
      const availableCount = allMccs.filter(m => !usedMccs.has(m.code)).length

      if (newMccCodes.length === availableCount && availableCount > 0) {
        setFormData(prev => ({ ...prev, mccCodes: ['All'] }))
        showMessage('Selected All MCCs.', 'success')
      } else {
        setFormData(prev => ({ ...prev, mccCodes: newMccCodes }))
      }
    }
    setMccSearchQuery('')
    setMccDropdownOpen(false)
  }

  const handleAddAllAvailableMccs = () => {
    setFormData(prev => ({ ...prev, mccCodes: ['All'] }))
    setMccDropdownOpen(false)
    showMessage('Selected All MCCs.', 'success')
  }

  const handleRemoveMccFromCategory = (codeToRemove) => {
    setFormData(prev => ({
      ...prev,
      mccCodes: prev.mccCodes.filter(code => code !== codeToRemove)
    }))
  }

  const filteredMccsDropdown = allMccs.filter(mcc => 
    mcc.code?.toLowerCase().includes(mccSearchQuery.toLowerCase()) ||
    mcc.description?.toLowerCase().includes(mccSearchQuery.toLowerCase())
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        titleEn: formData.titleEn, titleRu: formData.titleRu, titleAz: formData.titleAz,
        textEn: formData.textEn, textRu: formData.textRu, textAz: formData.textAz,
        rate: parseFloat(formData.rate) || 0,
        variant: formData.variant,
        mccCodes: formData.mccCodes
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
          <button className="admin-cb__add-btn" onClick={handleOpenMccModal}>
            MCC
          </button>
          <button className="admin-cb__add-btn" onClick={() => handleOpenModal()}>
            Add Category
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
                  <th>Variant</th>
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
                        <td>{c.variant || 'A'}</td>
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
                              <div 
                                className={`admin-cb__dropdown ${dropdownUp ? 'admin-cb__dropdown--up' : ''}`}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
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

      {/* MCC Management Modal */}
      {mccModalOpen && (
        <div className="admin-cb-modal-overlay" onClick={() => { setMccModalOpen(false); cancelEditMcc(); }}>
          <div className="admin-cb-modal" style={{ maxWidth: '600px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="admin-cb-modal__header">
              <h2>Manage MCC Codes</h2>
              <button className="admin-cb-modal__close" onClick={() => { setMccModalOpen(false); cancelEditMcc(); }}>&times;</button>
            </div>
            
            <div className="admin-cb-modal__content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              
              {/* Form to Create/Edit */}
              <div className="admin-cb-modal__form-row" style={{ alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <div className="admin-cb-modal__field" style={{ flex: '0 0 120px' }}>
                  <label>{editingMccId ? 'Edit MCC' : 'New MCC'}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1234" 
                    value={mccForm.code} 
                    onChange={e => setMccForm({...mccForm, code: e.target.value})} 
                  />
                </div>
                <div className="admin-cb-modal__field" style={{ flex: '1' }}>
                  <label>Description</label>
                  <input 
                    type="text"
                    placeholder="Description..." 
                    value={mccForm.description} 
                    onChange={e => setMccForm({...mccForm, description: e.target.value})}
                  />
                  <div className="admin-cb-modal__char-count" style={{ color: mccForm.description.length > 100 ? '#ff3b30' : '#888', fontSize: '11px', textAlign: 'right', marginTop: '4px' }}>
                    {mccForm.description.length}/100
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '22px' }}>
                  <button 
                    className="save-btn" 
                    onClick={handleSaveMcc} 
                    disabled={saving || !mccForm.code.trim() || mccForm.description.length > 100}
                    style={{ padding: '10px 16px', height: '42px' }}
                  >
                    {saving ? 'Saving...' : (editingMccId ? 'Update' : 'Add')}
                  </button>
                  {editingMccId && (
                    <button className="cancel-btn" onClick={cancelEditMcc} style={{ padding: '8px 16px', fontSize: '12px' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* List of Existing MCCs */}
              <div className="admin-cb__table-wrap" style={{ borderRadius: '8px' }}>
                <table style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMccs.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="admin-cb__empty">No MCCs found</td>
                      </tr>
                    ) : (
                      allMccs.map(mcc => (
                        <tr key={mcc.id} style={{ background: editingMccId === mcc.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
                          <td><strong>{mcc.code}</strong></td>
                          <td>{mcc.description || <span style={{ color: '#888' }}>No description</span>}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              type="button" 
                              onClick={() => startEditMcc(mcc)}
                              style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', marginRight: '12px', fontSize: '13px' }}
                            >
                              Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteMcc(mcc.id)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Cashback Category Modal */}
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
                  <label>Variant</label>
                  <select 
                    value={formData.variant} 
                    onChange={e => setFormData({...formData, variant: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '14px',
                      marginTop: '4px'
                    }}
                  >
                    <option value="A">Variant A</option>
                    <option value="B">Variant B</option>
                  </select>
                </div>
                <div className="admin-cb-modal__field" style={{ position: 'relative' }} ref={mccDropdownRef}>
                  <label>MCC Codes</label>
                  
                  <div className="mcc-multi-select">
                    <div className="mcc-multi-select__tags">
                      {(showAllMccs ? formData.mccCodes : formData.mccCodes.slice(0, 2)).map(code => (
                        <span key={code} className="mcc-multi-tag">
                          {code}
                          <button type="button" onClick={() => handleRemoveMccFromCategory(code)}>&times;</button>
                        </span>
                      ))}
                      {!showAllMccs && formData.mccCodes.length > 2 && (
                        <span 
                          className="mcc-multi-tag" 
                          style={{ cursor: 'pointer', background: 'rgba(255, 226, 138, 0.25)' }} 
                          onClick={() => setShowAllMccs(true)}
                        >
                          +{formData.mccCodes.length - 2}
                        </span>
                      )}
                      {showAllMccs && formData.mccCodes.length > 2 && (
                        <span 
                          className="mcc-multi-tag" 
                          style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.1)', color: '#ccc' }} 
                          onClick={() => setShowAllMccs(false)}
                        >
                          Show less
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search existing MCC..." 
                      value={mccSearchQuery} 
                      onChange={e => {
                        setMccSearchQuery(e.target.value)
                        setMccDropdownOpen(true)
                      }}
                      onFocus={() => setMccDropdownOpen(true)}
                    />
                  </div>
                  
                  {mccDropdownOpen && (
                    <div className="mcc-dropdown">
                      {filteredMccsDropdown.length > 0 ? (
                        <>
                          <div 
                            className="mcc-dropdown-item"
                            onClick={handleAddAllAvailableMccs}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', color: '#10b981' }}
                          >
                            + Select All Available MCCs
                          </div>
                          {filteredMccsDropdown.map(mcc => (
                          <div 
                            key={mcc.id || mcc.code} 
                            className="mcc-dropdown-item"
                            onClick={() => handleAddMccToCategory(mcc)}
                          >
                            <strong>{mcc.code}</strong> {mcc.description && `- ${mcc.description}`}
                          </div>
                        ))}
                        </>
                      ) : (
                        <div className="mcc-dropdown-empty">
                          No matching MCCs found. Please add a new MCC first.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="admin-cb-modal__footer">
              <button className="cancel-btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button 
                className="save-btn" 
                onClick={handleSave} 
                disabled={saving}
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
