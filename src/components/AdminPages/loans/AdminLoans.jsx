import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminLoans.scss'
import './AdminLoans_Responsive.scss'
import loaderIcon from '../../../assets/icons/loader.svg'
import LoaderSuccessIcon from '../../common/LoaderSuccessIcon'
import AdminMorphModal from '../AdminMorphModal/AdminMorphModal'
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
  const [rejectModalPos, setRejectModalPos] = useState(null)
  const [rejectLoanId, setRejectLoanId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' })

  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  const [reasonModal, setReasonModal] = useState({ show: false, reason: '', changedBy: '', time: '', clickPos: null })
  
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approveModalPos, setApproveModalPos] = useState(null)
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

  const openApproveModal = (id, e) => {
    setApproveLoanId(id)
    setApproveModalPos(e ? { x: e.clientX, y: e.clientY } : null)
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

  const openRejectModal = (id, e) => {
    setRejectLoanId(id)
    setRejectReason('')
    setRejectModalPos(e ? { x: e.clientX, y: e.clientY } : null)
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

      {error && <p className="admin-error-text">{error}</p>}
      
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
                                openApproveModal(loan.id, e);
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
                                openRejectModal(loan.id, e);
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
                                time: history.time,
                                clickPos: e ? { x: e.clientX, y: e.clientY } : null
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
                  <td colSpan="7" className="admin-table__empty-cell">
                    No loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AdminMorphModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        clickPos={rejectModalPos}
        overlayClass="admin-loans__modal-overlay"
        modalClass="admin-loans__modal"
      >
        <h3>Reject Loan</h3>
        <p className="admin-modal__subtitle">
          Please provide a reason for rejection. This will be sent to the user via email.
        </p>
        <textarea 
          placeholder="Enter rejection reason..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={100}
          className="admin-textarea--mb"
        />
        <div className="admin-char-counter" style={{ color: rejectReason.length >= 100 ? '#ef4444' : '#aaa' }}>
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
            className="confirm-btn danger" 
            onClick={handleReject}
            disabled={actionLoading || !rejectReason.trim()}
          >
            {actionLoading ? (
              <>
                <img src={loaderIcon} alt="Loading..." className="btn-loader" />
                Processing...
              </>
            ) : 'Confirm Reject'}
          </button>
        </div>
      </AdminMorphModal>

      <AdminMorphModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        clickPos={approveModalPos}
        overlayClass="admin-loans__modal-overlay"
        modalClass="admin-loans__modal"
      >
        <h3>Approve Loan</h3>
        <p className="admin-modal__subtitle admin-modal__subtitle--lg">
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
          >
            {actionLoading ? (
              <>
                <img src={loaderIcon} alt="Loading..." className="btn-loader" />
                Processing...
              </>
            ) : 'Confirm Approve'}
          </button>
        </div>
      </AdminMorphModal>

      <AdminMorphModal
        isOpen={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
        overlayClass="admin-loans__modal-overlay"
        modalClass="admin-loans__modal admin-loans__modal--centered"
      >
        <div className="admin-notification__icon-wrap">
          {notification.type === 'success' ? (
            <LoaderSuccessIcon className="modal-success-icon" />
          ) : (
            <LoaderSuccessIcon className="modal-success-icon" />
          )}
        </div>
        <h3 className="admin-notification__title">{notification.type === 'success' ? 'Success' : 'Error'}</h3>
        <p className="admin-notification__desc">
          {notification.message}
        </p>
        <button 
          className="confirm-btn admin-btn--close-notification" 
          onClick={() => setNotification({ ...notification, show: false })}
        >
          OK
        </button>
      </AdminMorphModal>
      {reasonModal.show && (() => {
        const changedByUser = users.find(u => u.id === reasonModal.changedBy)
        const changedByName = changedByUser ? `${changedByUser.firstName || ''} ${changedByUser.lastName || ''}`.trim() : (reasonModal.changedBy || 'System')
        
        return (
          <AdminMorphModal
            isOpen={reasonModal.show}
            onClose={() => setReasonModal({ ...reasonModal, show: false })}
            clickPos={reasonModal.clickPos}
            overlayClass="admin-loans__modal-overlay"
            modalClass="admin-loans-modal"
          >
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
              <div className="admin-reject-field">
                <div className="admin-reject-field__label">Rejected By</div>
                <div className="admin-reject-field__value">{changedByName}</div>
              </div>
              
              {reasonModal.time && (
                <div className="admin-reject-field">
                  <div className="admin-reject-field__label">Date</div>
                  <div className="admin-reject-field__value">{new Date(reasonModal.time).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              )}
              
              <div className="admin-reject-field">
                <div className="admin-reject-field__label">Reason</div>
                <div className="admin-reject-field__reason">
                  {reasonModal.reason}
                </div>
              </div>
            </div>
          </AdminMorphModal>
        )
      })()}
    </div>
  )
}

export default AdminLoans

