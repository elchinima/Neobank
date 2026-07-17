import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../config/api'
import './AdminLoans.scss'

const adminFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token')
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectLoanId, setRejectLoanId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

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

  useEffect(() => {
    fetchLoans()
  }, [])

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this loan?')) return

    try {
      setActionLoading(true)
      const res = await adminFetch(`${API_BASE_URL}/admin/loans/${id}/approve`, {
        method: 'POST'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Approval failed')
      }
      alert('Loan approved successfully!')
      fetchLoans()
    } catch (err) {
      alert(err.message)
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
      alert('Loan rejected successfully!')
      setShowRejectModal(false)
      fetchLoans()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-loans">
      <div className="admin-loans__header">
        <span className="admin-loans__eyebrow">Loans</span>
        <h1>Loan Applications</h1>
        <p>Manage and review pending user loan applications.</p>
      </div>

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
              {loans.map(loan => (
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
                  <td>
                    {loan.status === 'Pending' && (
                      <div className="admin-loans__actions">
                        <button 
                          className="approve-btn" 
                          onClick={() => handleApprove(loan.id)}
                          disabled={actionLoading}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => openRejectModal(loan.id)}
                          disabled={actionLoading}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {loan.statusHistory && loan.statusHistory.length > 1 && loan.status !== 'Pending' && (
                       <div style={{fontSize: '0.8rem', color: '#888', marginTop: '4px'}}>
                         {loan.statusHistory[loan.statusHistory.length - 1].reason && `Reason: ${loan.statusHistory[loan.statusHistory.length - 1].reason}`}
                       </div>
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
            />
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
    </div>
  )
}

export default AdminLoans
