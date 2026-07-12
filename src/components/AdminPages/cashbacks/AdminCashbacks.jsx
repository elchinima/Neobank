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
  const [confirmDeleteMccOpen, setConfirmDeleteMccOpen] = useState(false)
  const [mccToDelete, setMccToDelete] = useState(null)
  const [selectedCashback, setSelectedCashback] = useState(null)
  
  const [formData, setFormData] = useState({
    titleEn: '', titleRu: '', titleAz: '',
    textEn: '', textRu: '', textAz: '',
    rate: 0,
    limit: '1.00',
    variant: 'A',
    mccCodes: []
  })
  
  const [mccForm, setMccForm] = useState({ code: '', description: '' })
  const [editingMccId, setEditingMccId] = useState(null)
  const [mccListSearchQuery, setMccListSearchQuery] = useState('')
  const [appliedMccSearch, setAppliedMccSearch] = useState('')
  
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
      const sortedData = data.sort((a, b) => {
        const codeA = a.code || ''
        const codeB = b.code || ''
        return codeB.localeCompare(codeA)
      })
      setAllMccs(sortedData)
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
        limit: cashback.limit !== undefined ? Number(cashback.limit).toFixed(2) : '1.00',
        variant: cashback.variant || 'A',
        mccCodes: [...(cashback.mccCodes || [])].sort((a, b) => b.localeCompare(a))
      })
    } else {
      setSelectedCashback(null)
      setFormData({
        titleEn: '', titleRu: '', titleAz: '',
        textEn: '', textRu: '', textAz: '',
        rate: 0,
        limit: '1.00',
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
    
    if (editingMccId) {
      const originalMcc = allMccs.find(m => m.id === editingMccId)
      if (originalMcc && originalMcc.code === mccForm.code.trim() && (originalMcc.description || '') === mccForm.description.trim()) {
        cancelEditMcc()
        return // No changes made, just cancel editing
      }
    }

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

  const confirmDeleteMcc = (mcc) => {
    setMccToDelete(mcc)
    setConfirmDeleteMccOpen(true)
  }

  const handleDeleteMcc = async () => {
    if (!mccToDelete) return
    setSaving(true)
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/mccs/${mccToDelete.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete MCC')
      showMessage('MCC deleted successfully!', 'success')
      setConfirmDeleteMccOpen(false)
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
      const newMccCodes = [...formData.mccCodes, mcc.code].sort((a, b) => b.localeCompare(a))

      if (newMccCodes.length === allMccs.length && allMccs.length > 0) {
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

  const filteredMccsDropdown = allMccs.filter(mcc => {
    if (formData.mccCodes.includes('All')) return false
    if (formData.mccCodes.includes(mcc.code)) return false
    return mcc.code?.toLowerCase().includes(mccSearchQuery.toLowerCase()) ||
           mcc.description?.toLowerCase().includes(mccSearchQuery.toLowerCase())
  })

  const handleRateChange = (e) => {
    let val = e.target.value;
    
    if (val === '') {
      setFormData({ ...formData, rate: '' });
      return;
    }

    if (parseFloat(val) < 0) return;

    if (val.includes('.')) {
      const parts = val.split('.');
      if (parts[1].length > 1) {
        val = parts[0] + '.' + parts[1].slice(0, 1);
      }
    }
    
    setFormData({ ...formData, rate: val });
  }

  const handleRateBlur = () => {
    let parsed = parseFloat(formData.rate);
    if (isNaN(parsed) || parsed < 0.1) {
      setFormData({ ...formData, rate: 0.1 });
    } else {
      setFormData({ ...formData, rate: parsed });
    }
  }

  const handleLimitChange = (e) => {
    let val = e.target.value;
    
    if (val === '') {
      setFormData({ ...formData, limit: '' });
      return;
    }

    if (parseFloat(val) < 0) return;

    if (val.includes('.')) {
      const parts = val.split('.');
      if (parts[1].length > 2) {
        val = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }
    
    setFormData({ ...formData, limit: val });
  }

  const handleLimitBlur = () => {
    let parsed = parseFloat(formData.limit);
    if (isNaN(parsed) || parsed < 1.00) {
      setFormData({ ...formData, limit: '1.00' });
    } else {
      setFormData({ ...formData, limit: parsed.toFixed(2) });
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        titleEn: formData.titleEn, titleRu: formData.titleRu, titleAz: formData.titleAz,
        textEn: formData.textEn, textRu: formData.textRu, textAz: formData.textAz,
        rate: parseFloat(formData.rate) || 0,
        limit: parseFloat(formData.limit) || 1.00,
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

  const filteredAllMccs = allMccs.filter(mcc => {
    if (!appliedMccSearch) return true;
    const lowerSearch = appliedMccSearch.toLowerCase();
    return (
      (mcc.code || '').toLowerCase().includes(lowerSearch) ||
      (mcc.description || '').toLowerCase().includes(lowerSearch)
    );
  });

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

      {message && !mccModalOpen && !modalOpen && !confirmDeleteOpen && (
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
                  <th>Limit</th>
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
                        <td><strong>{(c.limit !== undefined ? Number(c.limit) : 1).toFixed(2)} ₼</strong></td>
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
          <div className="admin-cb-modal" style={{ maxWidth: '600px', width: '100%', height: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="admin-cb-modal__header">
              <h2>Manage MCC Codes</h2>
              <button className="admin-cb-modal__close" onClick={() => { setMccModalOpen(false); cancelEditMcc(); }}>&times;</button>
            </div>

            {message && (
              <div style={{ 
                margin: '16px 24px 0', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: message.type === 'error' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                color: message.type === 'error' ? '#ff3b30' : '#10b981',
                fontSize: '14px',
                fontWeight: '500',
                flexShrink: 0
              }}>
                {message.text}
              </div>
            )}
            
            <div className="admin-cb-modal__content" style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* Form to Create/Edit */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', width: '100%' }}>
                  <div className="admin-cb-modal__field" style={{ flex: '0 0 25%', minWidth: '0' }}>
                    <label>{editingMccId ? 'Edit MCC' : 'New MCC'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1234" 
                      value={mccForm.code} 
                      onChange={e => setMccForm({...mccForm, code: e.target.value})} 
                    />
                  </div>
                  <div className="admin-cb-modal__field" style={{ flex: '1 1 auto', minWidth: '0' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '22px', flex: '0 0 auto' }}>
                    <button 
                      className="save-btn" 
                      onClick={handleSaveMcc} 
                      disabled={saving || !mccForm.code.trim() || mccForm.description.length > 100}
                      style={{ padding: '10px 16px', height: '42px', minWidth: '90px', width: '90px' }}
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

                {/* The Search Bar which takes the bottom row */}
                <div style={{ width: '100%', display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="Search MCCs..." 
                    value={mccListSearchQuery}
                    onChange={(e) => setMccListSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setAppliedMccSearch(mccListSearchQuery) }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button 
                    className="save-btn" 
                    onClick={() => setAppliedMccSearch(mccListSearchQuery)}
                    style={{ padding: '10px 16px', height: '42px', minWidth: '90px', width: '90px' }}
                  >
                    Search
                  </button>
                </div>
              </div>
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
                    {filteredAllMccs.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="admin-cb__empty">No MCCs found</td>
                      </tr>
                    ) : (
                      filteredAllMccs.map(mcc => (
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
                              onClick={() => confirmDeleteMcc(mcc)}
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

      {/* Confirm Delete MCC Modal */}
      {confirmDeleteMccOpen && (
        <div className="admin-cb-modal-overlay" onClick={() => setConfirmDeleteMccOpen(false)}>
          <div className="admin-cb-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-cb-modal__header">
              <h2>Confirm Delete</h2>
              <button className="admin-cb-modal__close" onClick={() => setConfirmDeleteMccOpen(false)}>&times;</button>
            </div>
            <div className="admin-cb-modal__content">
              <p style={{ color: '#fff' }}>Are you sure you want to delete this MCC?</p>
            </div>
            <div className="admin-cb-modal__footer">
              <button className="cancel-btn" onClick={() => setConfirmDeleteMccOpen(false)}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteMcc} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
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

            {message && (
              <div style={{ 
                margin: '16px 24px 0', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                background: message.type === 'error' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                color: message.type === 'error' ? '#ff3b30' : '#10b981',
                fontSize: '14px',
                fontWeight: '500',
                flexShrink: 0
              }}>
                {message.text}
              </div>
            )}
            
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
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0.1"
                    value={formData.rate} 
                    onChange={handleRateChange} 
                    onBlur={handleRateBlur} 
                  />
                </div>
                <div className="admin-cb-modal__field">
                  <label>Limit (₼)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1.00"
                    value={formData.limit} 
                    onChange={handleLimitChange} 
                    onBlur={handleLimitBlur} 
                  />
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
                <div style={{ display: 'flex', width: '100%', gap: '16px', alignItems: 'flex-end', marginTop: '4px' }}>
                  <div className="admin-cb-modal__field" style={{ position: 'relative', flex: 1 }} ref={mccDropdownRef}>
                    <label>MCC Codes</label>
                    
                    <div className="mcc-multi-select" style={{ 
                      minHeight: '42px', 
                      padding: '8px', 
                      borderRadius: '8px', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      marginTop: '4px' 
                    }}>
                      <div className="mcc-multi-select__tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', height: '100%' }}>
                        {formData.mccCodes.slice(0, 2).map(code => (
                          <span key={code} className="mcc-multi-tag">
                            {code}
                            <button type="button" onClick={() => handleRemoveMccFromCategory(code)}>&times;</button>
                          </span>
                        ))}
                        
                        {formData.mccCodes.length > 2 && (
                          <span 
                            className="mcc-multi-tag" 
                            style={{ cursor: 'pointer', background: 'rgba(255, 226, 138, 0.25)' }} 
                            onClick={() => setShowAllMccs(!showAllMccs)}
                          >
                            +{formData.mccCodes.length - 2}
                          </span>
                        )}
                        
                        <button 
                          type="button" 
                          className="mcc-multi-tag" 
                          style={{ cursor: 'pointer', background: 'transparent', border: '1px dashed rgba(255, 226, 138, 0.5)', width: '32px', display: 'flex', justifyContent: 'center' }} 
                          onClick={() => setMccDropdownOpen(true)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {showAllMccs && (
                      <div className="mcc-dropdown" style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ width: '100%', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>All Added MCCs</span>
                          <button type="button" onClick={() => setShowAllMccs(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>&times;</button>
                        </div>
                        {formData.mccCodes.map(code => (
                          <span key={code} className="mcc-multi-tag">
                            {code}
                            <button type="button" onClick={() => handleRemoveMccFromCategory(code)}>&times;</button>
                          </span>
                        ))}
                      </div>
                    )}

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

                  <div style={{ display: 'flex', gap: '12px', flex: '0 0 auto' }}>
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
