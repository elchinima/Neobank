import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminUsers.scss'

const formatTableName = (user) => {
  const firstName = user.firstName || 'User'
  const lastName = user.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [statusModal, setStatusModal] = useState({ open: false, user: null })

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
    setActiveMenuId(activeMenuId === id ? null : id)
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
      alert(err.message)
    }
  }

  return (
    <div className="admin-users">
      <header className="admin-users__header">
        <div>
          <span className="admin-users__eyebrow">Admin Panel</span>
          <h1>Users</h1>
        </div>
        <div className="admin-users__search">
          <label htmlFor="admin-user-search">Search</label>
          <input
            id="admin-user-search"
            type="search"
            placeholder="Search by id, name, email or role"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
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
                    <span className="admin-users__role">{user.role || 'User'}</span>
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
                        <div className="admin-users__dropdown">
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
    </div>
  )
}

export default AdminUsers


