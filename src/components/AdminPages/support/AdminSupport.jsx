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

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [ratingFilter, setRatingFilter] = useState('All')
  const [commentFilter, setCommentFilter] = useState('All')

  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  
  const [historyModal, setHistoryModal] = useState({ open: false, chat: null, messages: [], loading: false })
  const [reviewModal, setReviewModal] = useState({ open: false, chat: null })

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    if (activeMenuId === id) {
      setActiveMenuId(null)
    } else {
      setActiveMenuId(id)
      const buttonRect = e.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - buttonRect.bottom
      setDropdownUp(spaceBelow < 150)
    }
  }

  const openHistoryModal = async (chat) => {
    setActiveMenuId(null)
    setHistoryModal({ open: true, chat, messages: [], loading: true })
    
    try {
      const response = await adminFetch(`${API_BASE_URL}/admin/support/${chat.id}/history`)
      if (!response.ok) throw new Error('Failed to fetch chat history')
      const messages = await response.json()
      setHistoryModal(prev => ({ ...prev, messages, loading: false }))
    } catch (err) {
      console.error(err)
      setHistoryModal(prev => ({ ...prev, loading: false }))
    }
  }

  const openReviewModal = (chat) => {
    setActiveMenuId(null)
    setReviewModal({ open: true, chat })
  }

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

  const filteredChats = useMemo(() => {
    let result = chats

    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(chat => {
        const idMatch = chat.id.toLowerCase().includes(lowerSearch)
        const nameMatch = formatTableName(chat).toLowerCase().includes(lowerSearch)
        return idMatch || nameMatch
      })
    }

    if (statusFilter !== 'All') {
      result = result.filter(chat => chat.status?.toLowerCase() === statusFilter.toLowerCase())
    }

    if (ratingFilter !== 'All') {
      result = result.filter(chat => chat.rating === Number(ratingFilter))
    }

    if (commentFilter !== 'All') {
      const hasComment = commentFilter === 'Yes'
      result = result.filter(chat => Boolean(chat.hasComment) === hasComment)
    }

    return result
  }, [chats, search, statusFilter, ratingFilter, commentFilter])

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading chats...'
    return `${filteredChats.length} chat${filteredChats.length === 1 ? '' : 's'}`
  }, [loading, filteredChats.length])

  return (
    <div className="admin-support">
      <header className="admin-support__header">
        <div>
          <span className="admin-support__eyebrow">Admin Panel</span>
          <h1>Support Chats</h1>
        </div>
        <div className="admin-support__actions">
          <div className="admin-support__search-group">
            <div className="admin-support__search">
              <label htmlFor="admin-support-search">Search</label>
              <input
                id="admin-support-search"
                type="search"
                placeholder="Search by ID, Name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(searchInput)
                }}
              />
            </div>
            <button 
              type="button" 
              className="admin-support__search-btn" 
              onClick={() => setSearch(searchInput)}
            >
              Search
            </button>
          </div>
          <div className="admin-support__filter-group">
            <div className="admin-support__filter">
              <label htmlFor="admin-support-status">Status</label>
              <select
                id="admin-support-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="admin-support__filter">
              <label htmlFor="admin-support-rating">Rating</label>
              <select
                id="admin-support-rating"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div className="admin-support__filter">
              <label htmlFor="admin-support-comment">Comment</label>
              <select
                id="admin-support-comment"
                value={commentFilter}
                onChange={(e) => setCommentFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
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
              {filteredChats.map((chat) => (
                <tr key={chat.id}>
                  <td title={chat.id}>{chat.id.substring(0, 8)}...</td>
                  <td>
                    <strong>{formatTableName(chat)}</strong>
                  </td>
                  <td>
                    {chat.created ? new Date(chat.created.replace(/Z$/, '').replace(/([+-]\d{2}:\d{2})$/, '')).toLocaleString() : ''}
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
                        onClick={(e) => toggleMenu(e, chat.id)}
                      >
                        <span />
                        <span />
                        <span />
                      </button>
                      
                      {activeMenuId === chat.id && (
                        <div className={`admin-support__dropdown ${dropdownUp ? 'admin-support__dropdown--up' : ''}`}>
                          <button onClick={() => openHistoryModal(chat)}>History</button>
                          {chat.hasComment && (
                            <button onClick={() => openReviewModal(chat)}>Review</button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredChats.length && !loading && (
                <tr>
                  <td colSpan="6" className="admin-support__empty">No support chats found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* History Modal */}
      {historyModal.open && historyModal.chat && (
        <div className="admin-support-modal-overlay" onClick={() => setHistoryModal({ open: false, chat: null, messages: [], loading: false })}>
          <div className="admin-support-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-support-modal__header">
              <h2>Chat History - {formatTableName(historyModal.chat)} (AI: {historyModal.chat.agentName || 'Agent'})</h2>
              <button className="admin-support-modal__close" onClick={() => setHistoryModal({ open: false, chat: null, messages: [], loading: false })}>&times;</button>
            </div>
            
            <div className="admin-support-modal__content" style={{ display: 'block' }}>
              {historyModal.loading ? (
                <p>Loading history...</p>
              ) : historyModal.messages.length === 0 ? (
                <p className="admin-support__empty">No messages found for this chat.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {historyModal.messages.map((msg, idx) => (
                    <div key={idx} className={`admin-support-chat-msg admin-support-chat-msg--${msg.sender.toLowerCase()}`}>
                      <div className="admin-support-chat-msg__bubble">
                        {msg.imagePath && <img src={msg.imagePath} alt="Attachment" className="admin-support-chat-msg__image" />}
                        {msg.text}
                      </div>
                      <span className="admin-support-chat-msg__time">{msg.time} - {msg.sender}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="admin-support-modal__footer">
              <button className="admin-support-modal__btn-cancel" onClick={() => setHistoryModal({ open: false, chat: null, messages: [], loading: false })}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Review Modal */}
      {reviewModal.open && reviewModal.chat && (
        <div className="admin-support-modal-overlay" onClick={() => setReviewModal({ open: false, chat: null })}>
          <div className="admin-support-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-support-modal__header">
              <h2>User Review - {formatTableName(reviewModal.chat)}</h2>
              <button className="admin-support-modal__close" onClick={() => setReviewModal({ open: false, chat: null })}>&times;</button>
            </div>
            
            <div className="admin-support-modal__content" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', fontSize: '18px' }}>
                <strong>Rating:</strong> {reviewModal.chat.rating} ⭐
              </div>
              <div>
                <strong style={{ fontSize: '16px' }}>Comment:</strong>
                <p style={{ marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {reviewModal.chat.commentText || "No comment provided."}
                </p>
              </div>
            </div>
            
            <div className="admin-support-modal__footer">
              <button className="admin-support-modal__btn-cancel" onClick={() => setReviewModal({ open: false, chat: null })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSupport
