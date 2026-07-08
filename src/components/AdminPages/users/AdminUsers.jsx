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
                  <td>
                    <button className="admin-users__dots" type="button" aria-label="Future user actions">
                      <span />
                      <span />
                      <span />
                    </button>
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
    </div>
  )
}

export default AdminUsers
