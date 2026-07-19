import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminLoans.scss'
import './AdminLoans_Responsive.scss'
const adminFetch = async (url, options = {}) => {
  const token = Cookies.get('neobank_token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(url, { ...options, headers })
}

const AdminLoans = () => {
  const [loans, setLoans] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectLoanId, setRejectLoanId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  const [reasonModal, setReasonModal] = useState({ show: false, reason: '', changedBy: '', time: '' })
  
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveLoanId, setApproveLoanId] = useState(null)

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

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const response = await adminFetch(`${API_BASE_URL}/admin/loans`)
      if (!response.ok) throw new Error('Failed to fetch loans')
      const data = await response.json()
      setLoans(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await adminFetch(`${API_BASE_URL}/admin/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchLoans()
    fetchUsers()
  }, [])

  const openApproveModal = (id) => {
    setApproveLoanId(id)
    setShowApproveModal(true)
  }

  const handleApproveConfirm = async () => {
    if (!approveLoanId) return

    try {
      setActionLoading(true)
      const res = await adminFetch(`${API_BASE_URL}/admin/loans/${approveLoanId}/approve`, {
        method: 'POST'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Approval failed')
      }
      setNotification({ show: true, message: 'Loan approved successfully!', type: 'success' })
      setShowApproveModal(false)
      fetchLoans()
    } catch (err) {
      setNotification({ show: true, message: err.message, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (id) => {
    setRejectLoanId(id)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectLoanId) return

    try {
      setActionLoading(true)
      const res = await adminFetch(`${API_BASE_URL}/admin/loans/${rejectLoanId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Rejection failed')
      }
      setNotification({ show: true, message: 'Loan rejected successfully!', type: 'success' })
      setShowRejectModal(false)
      fetchLoans()
    } catch (err) {
      setNotification({ show: true, message: err.message, type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredLoans = loans.filter(loan => {
    let match = true;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      const name = (loan.userFullName || '').toLowerCase();
      const email = (loan.userEmail || '').toLowerCase();
      if (!name.includes(lowerSearch) && !email.includes(lowerSearch)) {
        match = false;
      }
    }

    if (statusFilter !== 'All') {
      if (loan.status !== statusFilter) {
        match = false;
      }
    }

    return match;
  });

  return (
    <div className="admin-loans">
      <header className="admin-loans__header">
        <div>
          <span className="admin-loans__eyebrow">Loans</span>
          <h1>Loan Applications</h1>
          <p>Manage and review pending user loan applications.</p>
        </div>
        <div className="admin-loans__actions">
          <div className="admin-loans__search">
            <label htmlFor="admin-loans-search">Search</label>
            <input
              id="admin-loans-search"
              type="search"
              placeholder="Search by name, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput)
              }}
            />
          </div>
          <div className="admin-loans__action-btns">
            <div className="admin-loans__filter">
              <label htmlFor="admin-loans-filter">Status</label>
              <select
                id="admin-loans-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <button 
              type="button" 
              className="admin-loans__search-btn" 
              onClick={() => setSearch(searchInput)}
            >
              Search
            </button>
          </div>
        </div>
      </header>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-loans__table-wrapper">
          <table className="admin-loans__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Applicant</th>
                <th>Amount (AZN)</th>
                <th>Term</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map(loan => (
                <tr key={loan.id}>
                  <td>{new Date(loan.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="user-info">
                      <span className="name">{loan.userFullName || 'Unknown User'}</span>
                      <span className="email">{loan.userEmail || '-'}</span>
                    </div>
                  </td>
                  <td>{loan.amount.toFixed(2)}</td>
                  <td>{loan.termMonths} mo</td>
                  <td>{loan.interestRate}%</td>
                  <td>
                    <span className={`status-badge status-badge--${loan.status.toLowerCase()}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="admin-loans__actions-cell">
                    {loan.status === 'Pending' ? (
                      <div className="admin-loans__menu-container">
                        <button 
                          className="admin-loans__dots"
                          onClick={(e) => toggleMenu(e, loan.id)}
                          aria-label="Loan actions"
                        >
                          <span />
                          <span />
                          <span />
                        </button>
                        
                        {activeMenuId === loan.id && (
                          <div className={`admin-loans__dropdown ${dropdownUp ? 'admin-loans__dropdown--up' : ''}`}>
                            <button 
                              className="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                openApproveModal(loan.id);
                                setActiveMenuId(null);
                              }}
                              disabled={actionLoading}
                            >
                              Approve
                            </button>
                            <button 
                              className="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRejectModal(loan.id);
                                setActiveMenuId(null);
                              }}
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      loan.statusHistory && loan.statusHistory.length > 1 && loan.status !== 'Pending' && loan.statusHistory[loan.statusHistory.length - 1].reason && (
                        <div className="admin-loans__menu-container">
                          <button 
                            className="admin-loans__info-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const history = loan.statusHistory[loan.statusHistory.length - 1];
                              setReasonModal({
                                show: true,
                                reason: history.reason,
                                changedBy: history.changedBy,
                                time: history.time
                              });
                            }}
                            title="View Details"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="16" x2="12" y2="12"></line>
                              <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                          </button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>
                    No loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showRejectModal && (
        <div className="admin-loans__modal-overlay">
          <div className="admin-loans__modal">
            <h3>Reject Loan</h3>
            <p style={{ marginBottom: '16px', color: '#aaa', fontSize: '0.9rem' }}>
              Please provide a reason for rejection. This will be sent to the user via email.
            </p>
            <textarea 
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={100}
              style={{ marginBottom: '4px' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: rejectReason.length >= 100 ? '#ef4444' : '#aaa', marginBottom: '16px' }}>
              {rejectReason.length}/100 characters
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="admin-loans__modal-overlay">
          <div className="admin-loans__modal">
            <h3>Approve Loan</h3>
            <p style={{ marginBottom: '24px', color: '#aaa', fontSize: '0.9rem' }}>
              Are you sure you want to approve this loan? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleApproveConfirm}
                disabled={actionLoading}
                style={{ background: '#10b981', color: '#fff' }}
              >
                {actionLoading ? 'Processing...' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="admin-loans__modal-overlay">
          <div className="admin-loans__modal" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              {notification.type === 'success' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
            </div>
            <h3 style={{ marginBottom: '8px', color: '#fff' }}>{notification.type === 'success' ? 'Success' : 'Error'}</h3>
            <p style={{ marginBottom: '24px', color: '#aaa', fontSize: '0.9rem' }}>
              {notification.message}
            </p>
            <button 
              className="confirm-btn" 
              onClick={() => setNotification({ ...notification, show: false })}
              style={{ width: '100%', padding: '12px', background: 'rgba(160, 32, 240, 0.2)', border: '1px solid rgba(160, 32, 240, 0.3)', color: '#b185fa', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              OK
            </button>
          </div>
        </div>
      )}
      {reasonModal.show && (() => {
        const changedByUser = users.find(u => u.id === reasonModal.changedBy)
        const changedByName = changedByUser ? `${changedByUser.firstName || ''} ${changedByUser.lastName || ''}`.trim() : (reasonModal.changedBy || 'System')
        
        return (
          <div className="admin-loans__modal-overlay">
            <div className="admin-loans-modal">
              <div className="admin-loans-modal__header">
                <h2>Rejection Details</h2>
                <button 
                  className="admin-loans-modal__close"
                  onClick={() => setReasonModal({ ...reasonModal, show: false })}
                >
                  &times;
                </button>
              </div>
              
              <div className="admin-loans-modal__content">
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Rejected By</div>
                  <div style={{ color: '#fff', fontSize: '1rem' }}>{changedByName}</div>
                </div>
                
                {reasonModal.time && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Date</div>
                    <div style={{ color: '#fff', fontSize: '1rem' }}>{new Date(reasonModal.time).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Reason</div>
                  <div style={{ color: '#fff', whiteSpace: 'pre-wrap', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {reasonModal.reason}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default AdminLoans
