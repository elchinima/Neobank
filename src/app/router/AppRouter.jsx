import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from '../../pages/landing/Landing'
import Login from '../../pages/auth/Login'
import Register from '../../pages/auth/Register'
import TwoFactor from '../../pages/two-factor/TwoFactor'
import Dashboard from '../../pages/dashboard/Dashboard'
import Accounts from '../../pages/accounts/Accounts'
import AccountDetails from '../../pages/accounts/AccountDetails'
import Transfers from '../../pages/transfers/Transfers'
import Cards from '../../pages/cards/Cards'
import OrderCard from '../../pages/cards/OrderCard'
import Loans from '../../pages/loans/Loans'
import ApplyLoan from '../../pages/loans/ApplyLoan'
import Deposits from '../../pages/deposits/Deposits'
import CreateDeposit from '../../pages/deposits/CreateDeposit'
import Cashback from '../../pages/cashback/Cashback'
import Subscriptions from '../../pages/subscriptions/Subscriptions'
import Support from '../../pages/support/Support'
import TicketDetails from '../../pages/support/TicketDetails'
import AdminDashboard from '../../pages/admin/AdminDashboard'
import UsersManage from '../../pages/admin/UsersManage'
import AccountsManage from '../../pages/admin/AccountsManage'
import CardsManage from '../../pages/admin/CardsManage'
import LoansManage from '../../pages/admin/LoansManage'
import SubscriptionsManage from '../../pages/admin/SubscriptionsManage'
import SupportManage from '../../pages/admin/SupportManage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/two-factor" element={<TwoFactor />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetails />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/cards/order" element={<OrderCard />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/loans/apply" element={<ApplyLoan />} />
        <Route path="/deposits" element={<Deposits />} />
        <Route path="/deposits/create" element={<CreateDeposit />} />
        <Route path="/cashback" element={<Cashback />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/:id" element={<TicketDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManage />} />
        <Route path="/admin/accounts" element={<AccountsManage />} />
        <Route path="/admin/cards" element={<CardsManage />} />
        <Route path="/admin/loans" element={<LoansManage />} />
        <Route path="/admin/subscriptions" element={<SubscriptionsManage />} />
        <Route path="/admin/support" element={<SupportManage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter