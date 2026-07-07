import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminDashboard.scss'

const initialDashboard = {
  usersCount: 0,
  pagesCount: 0,
  footerLinksCount: 0,
  footerContactsCount: 0,
  recentUsers: [],
}

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(initialDashboard)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`)
        if (!response.ok) {
          throw new Error('Failed to load dashboard')
        }

        const data = await response.json()
        if (!ignore) {
          setDashboard({ ...initialDashboard, ...data })
        }
      } catch (err) {
        console.warn(err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      ignore = true
    }
  }, [])

  const stats = [
    { label: 'Users', value: dashboard.usersCount, to: '/admin/users' },
    { label: 'Public pages', value: dashboard.pagesCount, to: '/admin/content' },
    { label: 'Footer links', value: dashboard.footerLinksCount, to: '/admin/content' },
    { label: 'Footer contacts', value: dashboard.footerContactsCount, to: '/admin/content' },
  ]

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <span className="admin-dashboard__eyebrow">Admin Panel</span>
          <h1>Dashboard</h1>
        </div>
        <Link className="admin-dashboard__button admin-dashboard__button--primary" to="/admin/content">
          Manage public pages
        </Link>
      </header>

      <section className="admin-dashboard__stats" aria-label="Admin overview">
        {stats.map((stat) => (
          <Link className="admin-dashboard__stat" to={stat.to} key={stat.label}>
            <span>{stat.label}</span>
            <strong>{loading ? '-' : stat.value}</strong>
          </Link>
        ))}
      </section>

      <section className="admin-dashboard__panel" aria-labelledby="recent-users-title">
        <div className="admin-dashboard__panel-header">
          <div>
            <span className="admin-dashboard__eyebrow">Latest accounts</span>
            <h2 id="recent-users-title">Recent users</h2>
          </div>
          <Link to="/admin/users">View all</Link>
        </div>

        <div className="admin-dashboard__recent-list">
          {dashboard.recentUsers.length ? dashboard.recentUsers.map((user) => (
            <article className="admin-dashboard__recent-user" key={user.id}>
              <div>
                <strong>{user.firstName} {user.lastName}</strong>
                <span>{user.id}</span>
              </div>
              <small>{user.role}</small>
            </article>
          )) : (
            <p className="admin-dashboard__empty">No users yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
