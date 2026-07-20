import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import Cookies from 'js-cookie'
import './AdminSupport.scss'
import './AdminSupport_Responsive.scss'

const adminFetch = (url, options = {}) => {
  const token = Cookies.get('neobank_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};

const formatTableName = (chat) => {
  const firstName = chat.firstName || 'Unknown'
  const lastName = chat.lastName || ''
  return `${firstName} ${lastName}`.trim()
}

const AdminSupport = () => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function loadChats() {
      setLoading(true)
      try {
        const response = await adminFetch(`${API_BASE_URL}/admin/support`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('Failed to load support chats')
        }

        const data = await response.json()
        setChats(Array.isArray(data) ? data : [])
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

    loadChats()
    return () => {
      controller.abort()
    }
  }, [])

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading chats...'
    return `${chats.length} chat${chats.length === 1 ? '' : 's'}`
  }, [loading, chats.length])

  return (
    <div className="admin-support">
      <header className="admin-support__header">
        <div>
          <span className="admin-support__eyebrow">Admin Panel</span>
          <h1>Support Chats</h1>
        </div>
      </header>

      <section className="admin-support__table-card" aria-label="Support chats table">
        <div className="admin-support__table-meta">{resultLabel}</div>
        <div className="admin-support__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Chat ID</th>
                <th>User Name</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Rating</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {chats.map((chat) => (
                <tr key={chat.id}>
                  <td title={chat.id}>{chat.id.substring(0, 8)}...</td>
                  <td>
                    <strong>{formatTableName(chat)}</strong>
                  </td>
                  <td>
                    {new Date(chat.created).toLocaleString()}
                  </td>
                  <td>
                    <span className={`admin-support__status admin-support__status--${chat.status?.toLowerCase() === 'active' ? 'active' : 'blocked'}`}>
                      {chat.status}
                    </span>
                  </td>
                  <td>
                    {chat.rating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {chat.rating} ⭐ 
                        {chat.hasComment && <span title="User left a comment" style={{ fontSize: '14px' }}>💬</span>}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>No rating</span>
                    )}
                  </td>
                  <td className="admin-support__actions-cell">
                    <div className="admin-support__menu-container">
                      <button 
                        className="admin-support__dots" 
                        type="button" 
                        aria-label="Chat actions"
                      >
                        <span />
                        <span />
                        <span />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!chats.length && !loading && (
                <tr>
                  <td colSpan="6" className="admin-support__empty">No support chats found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminSupport
