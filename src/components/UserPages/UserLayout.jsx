import { Outlet } from 'react-router-dom'
import UserNavbar from './UserNavbar'
import PublicFooter from '../PublicFooter/PublicFooter'
import './UserLayout.scss'

const UserLayout = () => {
  return (
    <div className="user-layout">
      <UserNavbar />
      <main className="user-layout__main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default UserLayout
