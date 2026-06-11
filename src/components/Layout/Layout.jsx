import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import './Layout.scss'

function Layout({ title, children }) {
  return (
    <div className="layout">
      <Sidebar />
      <Header title={title} />
      <main className="layout__content">
        {children}
      </main>
    </div>
  )
}

export default Layout