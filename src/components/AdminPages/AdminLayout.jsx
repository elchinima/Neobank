import { Outlet } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'
import './AdminLayout.scss'

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
