import { useEffect, useMemo, useState, useRef } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import { useAuth } from '../../../app/context/AuthContext'
import './AdminUsers.scss'

const formatTableName = (user) => {
  const firstName = user.firstName || 'User'
  const lastName = user.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

// Converts enum string (e.g. "SuperAdmin") to display name ("Super Admin")
const formatRoleName = (role) => {
  if (!role) return 'User'
  return role.replace(/([a-z])([A-Z])/g, '$1 $2')
}

const AdminUsers = () => {
  const { user: authUser } = useAuth()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  const [statusModal, setStatusModal] = useState({ open: false, user: null })
  const [emailModal, setEmailModal] = useState({ open: false, user: null, isNewsletter: false })
  const [emailData, setEmailData] = useState({ emailTitle: '', contentTitle: '', contentMessage: '' })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [alertModal, setAlertModal] = useState({ open: false, message: '', isError: false })
  const [roleModal, setRoleModal] = useState({ open: false, user: null, selectedRole: '' })
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [emailFile, setEmailFile] = useState(null)
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const [infoModal, setInfoModal] = useState({ open: false, user: null })
  const [infoData, setInfoData] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [noteValue, setNoteValue] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [resetting2Fa, setResetting2Fa] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, message: '', onConfirm: null })

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadUsers() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (search.trim()) {
          params.set('search', search.trim())
        }

        const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load users')
        }

        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn(err)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    const timer = window.setTimeout(loadUsers, 220)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading users'
    return `${users.length} user${users.length === 1 ? '' : 's'}`
  }, [loading, users.length])

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    if (activeMenuId === id) {
      setActiveMenuId(null)
    } else {
      setActiveMenuId(id)
      const buttonRect = e.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - buttonRect.bottom
      setDropdownUp(spaceBelow < 200)
    }
  }

  const openStatusModal = (user) => {
    setStatusModal({ open: true, user })
    setActiveMenuId(null)
  }

  const confirmToggleStatus = async () => {
    const { user } = statusModal
    if (!user) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/toggle-status`, {
        method: 'PUT'
      })
      if (!response.ok) {
        throw new Error('Failed to toggle status')
      }
      
      const result = await response.json()
      
      setUsers(currentUsers => 
        currentUsers.map(u => 
          u.id === user.id ? { ...u, isActive: result.isActive } : u
        )
      )
      setStatusModal({ open: false, user: null })
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
    }
  }

  const openRoleModal = async (user) => {
    setActiveMenuId(null)
    setRoleModal({ open: true, user, selectedRole: user.role || 'User' })
    if (roles.length === 0) {
      setLoadingRoles(true)
      try {
        const res = await fetch(`${API_BASE_URL}/admin/roles`)
        if (res.ok) {
          const data = await res.json()
          setRoles(data)
        }
      } catch (err) {
        setAlertModal({ open: true, message: 'Failed to load roles', isError: true })
      } finally {
        setLoadingRoles(false)
      }
    }
  }

  const confirmAssignRole = async () => {
    const { user, selectedRole } = roleModal
    if (!user) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRole })
      })
      if (!response.ok) {
        throw new Error('Failed to update role')
      }
      
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: selectedRole } : u))
      setRoleModal({ open: false, user: null, selectedRole: '' })
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
    }
  }

  const openEmailModal = (user) => {
    setEmailModal({ open: true, user, isNewsletter: false })
    setEmailData({ emailTitle: '', contentTitle: '', contentMessage: '' })
    setEmailFile(null)
    setEmailPreviewUrl(null)
    setActiveMenuId(null)
  }

  const openNewsletterEmailModal = () => {
    setEmailModal({ open: true, user: null, isNewsletter: true })
    setEmailData({ emailTitle: '', contentTitle: '', contentMessage: '' })
    setEmailFile(null)
    setEmailPreviewUrl(null)
    setActiveMenuId(null)
  }

  const handleEmailChange = (e) => {
    const { name, value } = e.target
    setEmailData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const validateAndSetFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setAlertModal({ open: true, message: 'File size must be less than 5MB', isError: true })
      return
    }
    const validTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp',
      'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!validTypes.includes(file.type)) {
      setAlertModal({ open: true, message: 'Only PNG, JPG, GIF, WEBP, DOCX, and PDF are allowed', isError: true })
      return
    }
    
    setEmailFile(file)
    if (file.type.startsWith('image/')) {
      setEmailPreviewUrl(URL.createObjectURL(file))
    } else {
      setEmailPreviewUrl(null)
    }
  }

  const handleSendEmail = async () => {
    const { user, isNewsletter } = emailModal
    if (!user && !isNewsletter) return

    setSendingEmail(true)
    try {
      const formData = new FormData()
      formData.append('EmailTitle', emailData.emailTitle)
      formData.append('ContentTitle', emailData.contentTitle)
      formData.append('ContentMessage', emailData.contentMessage)
      if (emailFile) {
        formData.append('Attachment', emailFile)
      }

      let endpoint = isNewsletter 
        ? `${API_BASE_URL}/admin/users/send-newsletter`
        : `${API_BASE_URL}/admin/users/${user.id}/send-email`

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Failed to send email')
      }

      const data = await response.json().catch(() => ({}))
      
      let successMsg = isNewsletter 
        ? `Email sent successfully to ${data.sentCount !== undefined ? data.sentCount : 'all'} subscribers!`
        : 'Email sent successfully!'

      setEmailModal({ open: false, user: null, isNewsletter: false })
      setAlertModal({ open: true, message: successMsg, isError: false })
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
    } finally {
      setSendingEmail(false)
    }
  }

  const openInfoModal = async (user) => {
    setActiveMenuId(null)
    setInfoModal({ open: true, user })
    setLoadingInfo(true)
    setInfoData(null)
    setNoteValue('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/details`)
      if (!response.ok) throw new Error('Failed to load user details')
      const data = await response.json()
      setInfoData(data)
      setNoteValue(data.note || '')
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
      setInfoModal({ open: false, user: null })
    } finally {
      setLoadingInfo(false)
    }
  }

  const handleSaveNote = async () => {
    const { user } = infoModal
    if (!user) return

    setSavingNote(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteValue })
      })
      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Failed to save note')
      }
      setAlertModal({ open: true, message: 'Note saved successfully!', isError: false })
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
    } finally {
      setSavingNote(false)
    }
  }

  const handleReset2Fa = async () => {
    const { user } = infoModal
    if (!user) return

    setResetting2Fa(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/reset-2fa`, {
        method: 'POST'
      })
      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Failed to reset 2FA')
      }
      setAlertModal({ open: true, message: '2FA reset email sent successfully!', isError: false })
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
    } finally {
      setResetting2Fa(false)
    }
  }

  const handleToggleCardStatus = async (cardId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/cards/${cardId}/toggle-status`, {
        method: 'PUT'
      })
      if (!response.ok) {
        throw new Error('Failed to toggle card status')
      }
      const result = await response.json()
      
      setInfoData(prev => ({
        ...prev,
        cards: prev.cards.map(c => c.id === cardId ? { ...c, status: result.status } : c)
      }))
    } catch (err) {
      setAlertModal({ open: true, message: err.message, isError: true })
    }
  }

  return (
    <div className="admin-users">
      <header className="admin-users__header">
        <div>
          <span className="admin-users__eyebrow">Admin Panel</span>
          <h1>Users</h1>
        </div>
        <div className="admin-users__actions" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="admin-users__search">
            <label htmlFor="admin-user-search">Search</label>
            <input
              id="admin-user-search"
              type="search"
              placeholder="Search by id, name, email or role"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput)
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="admin-users__search-btn" 
              onClick={() => setSearch(searchInput)}
            >
              Search
            </button>
            <button 
              type="button" 
              className="admin-users__search-btn" 
              onClick={openNewsletterEmailModal}
            >
              Send to Subscribers
            </button>
          </div>
        </div>
      </header>

      <section className="admin-users__table-card" aria-label="Users table">
        <div className="admin-users__table-meta">{resultLabel}</div>
        <div className="admin-users__table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <strong>{formatTableName(user)}</strong>
                  </td>
                  <td>
                    <span className="admin-users__role">{formatRoleName(user.role)}</span>
                  </td>
                  <td>
                    <span className={`admin-users__status admin-users__status--${user.isActive ? 'active' : 'blocked'}`}>
                      {user.isActive ? 'Active' : 'Block'}
                    </span>
                  </td>
                  <td className="admin-users__actions-cell">
                    <div className="admin-users__menu-container">
                      <button 
                        className="admin-users__dots" 
                        type="button" 
                        aria-label="User actions"
                        onClick={(e) => toggleMenu(e, user.id)}
                      >
                        <span />
                        <span />
                        <span />
                      </button>

                      {activeMenuId === user.id && (
                        <div className={`admin-users__dropdown ${dropdownUp ? 'admin-users__dropdown--up' : ''}`}>
                          <button onClick={() => openInfoModal(user)}>View Info</button>
                          {user.id !== authUser?.id && (
                            <button onClick={() => openRoleModal(user)}>Assign Role</button>
                          )}
                          <button onClick={() => openEmailModal(user)}>Send Email</button>
                          <button 
                            className={user.isActive ? 'danger' : 'success'} 
                            onClick={() => openStatusModal(user)}
                          >
                            {user.isActive ? 'Block User' : 'Unblock User'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && !loading && (
                <tr>
                  <td colSpan="5" className="admin-users__empty">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Status Modal */}
      {statusModal.open && statusModal.user && (
        <div className="admin-users-modal-overlay" onClick={() => setStatusModal({ open: false, user: null })}>
          <div className="admin-users-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="admin-users-modal__header">
              <h2>{statusModal.user.isActive ? 'Block User' : 'Unblock User'}</h2>
              <button className="admin-users-modal__close" onClick={() => setStatusModal({ open: false, user: null })}>&times;</button>
            </div>
            <div className="admin-users-modal__content">
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
                {statusModal.user.isActive 
                  ? <>Are you sure you want to block <strong>{formatTableName(statusModal.user)}</strong>? They will not be able to log in.</>
                  : <>Are you sure you want to unblock <strong>{formatTableName(statusModal.user)}</strong>?</>
                }
              </p>
            </div>
            <div className="admin-users-modal__footer">
              <button className="admin-users-modal__btn-cancel" onClick={() => setStatusModal({ open: false, user: null })}>Cancel</button>
              <button 
                className="admin-users-modal__btn-save" 
                onClick={confirmToggleStatus}
                style={statusModal.user.isActive ? { background: '#ff3b30', color: '#fff' } : { background: '#2ecc71', color: '#fff' }}
              >
                {statusModal.user.isActive ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {roleModal.open && roleModal.user && (
        <div className="admin-users-modal-overlay" onClick={() => setRoleModal({ open: false, user: null, selectedRole: '' })}>
          <div className="admin-users-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="admin-users-modal__header">
              <h2>Assign Role</h2>
              <button className="admin-users-modal__close" onClick={() => setRoleModal({ open: false, user: null, selectedRole: '' })}>&times;</button>
            </div>
            <div className="admin-users-modal__content">
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginBottom: '16px' }}>
                Select a new role for <strong>{formatTableName(roleModal.user)}</strong>.
              </p>
              {loadingRoles ? (
                <p>Loading roles...</p>
              ) : (
                <div className="admin-users-modal__field">
                  <div className="admin-users-modal__input-wrap">
                    <select
                      value={roleModal.selectedRole}
                      onChange={(e) => setRoleModal(prev => ({ ...prev, selectedRole: e.target.value }))}
                      className="admin-users-modal__select"
                    >
                      {roles
                        .filter(r => {
                          const currentUserRoleObj = roles.find(cr => cr.id === authUser?.role);
                          // Only allow assigning roles with a higher Order value (lower rank)
                          return currentUserRoleObj && r.order > currentUserRoleObj.order;
                        })
                        .map(r => (
                        <option key={r.id} value={r.id} style={{ background: '#0a0d14' }}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="admin-users-modal__footer">
              <button className="admin-users-modal__btn-cancel" onClick={() => setRoleModal({ open: false, user: null, selectedRole: '' })}>Cancel</button>
              <button 
                className="admin-users-modal__btn-save" 
                onClick={confirmAssignRole}
                disabled={loadingRoles}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModal.open && (emailModal.user || emailModal.isNewsletter) && (
        <div className="admin-users-modal-overlay" onClick={() => !sendingEmail && setEmailModal({ open: false, user: null, isNewsletter: false })}>
          <div className="admin-users-modal admin-users-modal--email" onClick={e => e.stopPropagation()}>
            <div className="admin-users-modal__header">
              <h2>Send Email to {emailModal.isNewsletter ? 'All Subscribed Users' : formatTableName(emailModal.user)}</h2>
              <button className="admin-users-modal__close" onClick={() => !sendingEmail && setEmailModal({ open: false, user: null, isNewsletter: false })}>&times;</button>
            </div>
            
            <div className="admin-users-modal__content">
              <div className="admin-users-modal__field">
                <label>Email Title (Subject)</label>
                <div className="admin-users-modal__input-wrap">
                  <input
                    type="text"
                    name="emailTitle"
                    value={emailData.emailTitle}
                    onChange={handleEmailChange}
                    maxLength={100}
                    placeholder="Enter email subject"
                  />
                  <span className="admin-users-modal__counter">{emailData.emailTitle.length}/100</span>
                </div>
              </div>

              <div className="admin-users-modal__field">
                <label>Content Title</label>
                <div className="admin-users-modal__input-wrap">
                  <input
                    type="text"
                    name="contentTitle"
                    value={emailData.contentTitle}
                    onChange={handleEmailChange}
                    maxLength={100}
                    placeholder="Enter title displayed inside the email"
                  />
                  <span className="admin-users-modal__counter">{emailData.contentTitle.length}/100</span>
                </div>
              </div>

              <div className="admin-users-modal__field">
                <label>Content Message</label>
                <div className="admin-users-modal__input-wrap">
                  <textarea
                    name="contentMessage"
                    value={emailData.contentMessage}
                    onChange={handleEmailChange}
                    maxLength={1000}
                    rows="6"
                    placeholder="Enter the main content of the email"
                  ></textarea>
                  <span className="admin-users-modal__counter">{emailData.contentMessage.length}/1000</span>
                </div>
              </div>

              <div 
                className="admin-users-modal__dropzone" 
                onDragOver={e => e.preventDefault()} 
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, application/pdf, .docx" 
                  hidden 
                />
                {emailFile ? (
                  emailPreviewUrl ? (
                    <img src={emailPreviewUrl} alt="Attachment Preview" className="admin-users-modal__preview-img" />
                  ) : (
                    <div className="admin-users-modal__file-info">
                      📄 {emailFile.name} ({(emailFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )
                ) : (
                  <p>Drag & drop file here or click to select<br/><span>Max 5MB (PNG, JPG, WEBP, GIF, PDF, DOCX)</span></p>
                )}
              </div>
            </div>
            
            <div className="admin-users-modal__footer">
              <button className="admin-users-modal__btn-cancel" disabled={sendingEmail} onClick={() => setEmailModal({ open: false, user: null, isNewsletter: false })}>Cancel</button>
              <button 
                className="admin-users-modal__btn-save" 
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailData.emailTitle.trim() || !emailData.contentTitle.trim() || !emailData.contentMessage.trim()}
              >
                {sendingEmail ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {infoModal.open && infoModal.user && (
        <div className="admin-users-modal-overlay" onClick={() => setInfoModal({ open: false, user: null })}>
          <div className="admin-users-modal admin-users-modal--info" onClick={e => e.stopPropagation()}>
            <div className="admin-users-modal__header">
              <h2>User Details: {formatTableName(infoModal.user)}</h2>
              <button className="admin-users-modal__close" onClick={() => setInfoModal({ open: false, user: null })}>&times;</button>
            </div>
            
            <div className="admin-users-modal__content">
              {loadingInfo ? (
                <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>Loading...</div>
              ) : infoData ? (
                <>
                  <div className="admin-users-modal__profile-header">
                    {infoData.avatarUrl ? (
                      <img src={infoData.avatarUrl} alt="Avatar" />
                    ) : (
                      <div className="profile-placeholder">
                        {infoData.firstName ? infoData.firstName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h4>{formatTableName(infoData)}</h4>
                      <span>ID: {infoData.id}</span>
                    </div>
                  </div>

                  <div className="admin-users-modal__grid-2">
                    <div className="admin-users-modal__info-section">
                      <h3>General Info</h3>
                      <div className="admin-users-modal__list-item" style={{ gap: '16px' }}>
                        <dl className="admin-users-modal__kv" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: 0 }}>
                          <div>
                            <dt>Role</dt>
                            <dd>{formatRoleName(infoData.role)}</dd>
                          </div>
                          <div>
                            <dt>Status</dt>
                            <dd style={{ color: infoData.isActive ? '#2ecc71' : '#e74c3c' }}>{infoData.isActive ? 'Active' : 'Blocked'}</dd>
                          </div>
                          <div>
                            <dt>Email</dt>
                            <dd>{infoData.email}</dd>
                          </div>
                          <div>
                            <dt>2FA Status</dt>
                            <dd style={{ color: infoData.twoFactorEnabled ? '#2ecc71' : '#f3c24a' }}>{infoData.twoFactorEnabled ? 'Enabled' : 'Disabled'}</dd>
                          </div>
                          <div>
                            <dt>Created At</dt>
                            <dd>{new Date(infoData.createdAt).toLocaleString()}</dd>
                          </div>
                          <div>
                            <dt>Last Login At</dt>
                            <dd>{infoData.lastLoginAt ? new Date(infoData.lastLoginAt).toLocaleString() : 'Never'}</dd>
                          </div>
                          <div>
                            <dt>Registration IP</dt>
                            <dd>{infoData.registrationIp || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt>Last Login IP</dt>
                            <dd>{infoData.lastIp || 'N/A'}</dd>
                          </div>
                        </dl>
                        
                        {infoData.twoFactorEnabled && (
                          <div className="admin-users-modal__action-row">
                            <button 
                              className="admin-users-modal__btn-save" 
                              style={{ background: '#e74c3c', color: '#fff', fontSize: '13px', padding: '8px 16px' }}
                              onClick={() => setConfirmModal({
                                open: true,
                                message: 'Are you sure you want to send a 2FA reset email to this user?',
                                onConfirm: () => handleReset2Fa()
                              })}
                              disabled={resetting2Fa}
                            >
                              {resetting2Fa ? 'Sending...' : 'Reset 2FA (Send Email)'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="admin-users-modal__info-section">
                      <h3>Note</h3>
                      <div className="admin-users-modal__field">
                        <div className="admin-users-modal__input-wrap" style={{ height: '100%' }}>
                          <textarea
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            maxLength={1000}
                            placeholder="Add a note about this user..."
                            style={{ height: '160px', minHeight: '160px' }}
                          ></textarea>
                          <span className="admin-users-modal__counter">{noteValue.length}/1000</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                        <button 
                          className="admin-users-modal__btn-save"
                          style={{ fontSize: '13px', padding: '8px 24px' }}
                          onClick={() => setConfirmModal({
                            open: true,
                            message: 'Are you sure you want to save this note?',
                            onConfirm: () => handleSaveNote()
                          })}
                          disabled={savingNote || noteValue === (infoData?.note || '')}
                        >
                          {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {infoData.cards && infoData.cards.length > 0 && (
                    <div className="admin-users-modal__info-section">
                      <h3>Cards ({infoData.cards.length})</h3>
                      <div className="admin-users-modal__list">
                        {infoData.cards.map((card, i) => (
                          <div key={i} className="admin-users-modal__list-item">
                            <div className="admin-users-modal__list-item-header">
                              <strong>**** **** **** {card.cardNumber?.slice(-4) || '****'} ({card.network || 'Unknown'}) - {card.type || card.cardType || 'Standard'}</strong>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className={card.status === 'Active' ? 'active' : 'inactive'}>{card.status}</span>
                                <button 
                                  onClick={() => setConfirmModal({
                                    open: true,
                                    message: `Are you sure you want to ${card.status === 'Active' ? 'block' : 'unblock'} this card?`,
                                    onConfirm: () => handleToggleCardStatus(card.id)
                                  })}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'transparent',
                                    color: '#fff',
                                    textTransform: 'uppercase'
                                  }}
                                >
                                  {card.status === 'Active' ? 'Block' : 'Unblock'}
                                </button>
                              </div>
                            </div>
                            <div className="admin-users-modal__list-item-body" style={{ gridTemplateColumns: '1fr 1fr 2fr' }}>
                              <dl className="admin-users-modal__kv">
                                <dt>Balance</dt>
                                <dd>{card.balance?.toFixed(2) || '0.00'} ₼</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Credit Limit</dt>
                                <dd>{card.creditLimit?.toFixed(2) || '0.00'} ₼</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>IBAN</dt>
                                <dd>{card.iban}</dd>
                              </dl>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {infoData.deposits && infoData.deposits.length > 0 && (
                    <div className="admin-users-modal__info-section">
                      <h3>Active Deposits ({infoData.deposits.length})</h3>
                      <div className="admin-users-modal__list">
                        {infoData.deposits.map((dep, i) => (
                          <div key={i} className="admin-users-modal__list-item">
                            <div className="admin-users-modal__list-item-header">
                              <strong>Deposit</strong>
                              <span className="active">Active</span>
                            </div>
                            <div className="admin-users-modal__list-item-body" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                              <dl className="admin-users-modal__kv">
                                <dt>Amount</dt>
                                <dd>₼{dep.amount?.toFixed(2) || '0.00'}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Interest Rate</dt>
                                <dd>{dep.interestRate}%</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Profit</dt>
                                <dd>₼{dep.totalIncome?.toFixed(2) || '0.00'}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Term (Months)</dt>
                                <dd>{dep.termMonths}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Created At</dt>
                                <dd>{new Date(dep.createdAt).toLocaleDateString()}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Payout Date</dt>
                                <dd>{new Date(new Date(dep.createdAt).setMonth(new Date(dep.createdAt).getMonth() + dep.termMonths)).toLocaleDateString()}</dd>
                              </dl>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {infoData.loans && infoData.loans.length > 0 && (
                    <div className="admin-users-modal__info-section">
                      <h3>Active Loans ({infoData.loans.length})</h3>
                      <div className="admin-users-modal__list">
                        {infoData.loans.map((loan, i) => (
                          <div key={i} className="admin-users-modal__list-item">
                            <div className="admin-users-modal__list-item-header">
                              <strong>Loan</strong>
                              <span className="active">Active</span>
                            </div>
                            <div className="admin-users-modal__list-item-body" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                              <dl className="admin-users-modal__kv">
                                <dt>Amount</dt>
                                <dd>₼{loan.amount?.toFixed(2) || '0.00'}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Remaining</dt>
                                <dd>₼{loan.remainingBalance?.toFixed(2) || '0.00'}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Monthly Payment</dt>
                                <dd>₼{loan.monthlyPayment?.toFixed(2) || '0.00'}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Interest Rate</dt>
                                <dd>{loan.interestRate}%</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Term (Months)</dt>
                                <dd>{loan.termMonths}</dd>
                              </dl>
                              <dl className="admin-users-modal__kv">
                                <dt>Next Payment</dt>
                                <dd>{loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString() : 'N/A'}</dd>
                              </dl>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.open && (
        <div className="admin-users-modal-overlay" style={{ zIndex: 2000 }} onClick={() => setAlertModal({ open: false, message: '', isError: false })}>
          <div className="admin-users-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="admin-users-modal__content" style={{ padding: '32px 24px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {alertModal.isError ? '❌' : '✅'}
              </div>
              <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 12px 0' }}>
                {alertModal.isError ? 'Error' : 'Success'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
                {alertModal.message}
              </p>
            </div>
            <div className="admin-users-modal__footer" style={{ justifyContent: 'center', borderTop: 'none', paddingBottom: '24px' }}>
              <button 
                className="admin-users-modal__btn-save" 
                onClick={() => setAlertModal({ open: false, message: '', isError: false })}
                style={{ width: '120px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="admin-users-modal-overlay" style={{ zIndex: 3000 }} onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}>
          <div className="admin-users-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="admin-users-modal__content" style={{ padding: '32px 24px 24px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 12px 0' }}>Confirm Action</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: 0, lineHeight: 1.5 }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="admin-users-modal__footer" style={{ justifyContent: 'center', borderTop: 'none', paddingBottom: '24px', gap: '16px' }}>
              <button 
                className="admin-users-modal__btn-cancel" 
                onClick={() => setConfirmModal({ open: false, message: '', onConfirm: null })}
                style={{ width: '120px' }}
              >
                Cancel
              </button>
              <button 
                className="admin-users-modal__btn-save" 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ open: false, message: '', onConfirm: null });
                }}
                style={{ width: '120px' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers


