import AdminSidebar from '../AdminSidebar/AdminSidebar'
import Header from '../Header/Header'
import './AdminLayout.scss'

function AdminLayout({ title, children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <Header title={title} />
      <main className="admin-layout__content">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout