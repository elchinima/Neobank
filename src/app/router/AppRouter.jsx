import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from '../../components/PublicPages/landing/Landing'
import Login from '../../components/PublicPages/auth/Login'
import Register from '../../components/PublicPages/auth/Register'
import CardsPublic from '../../components/PublicPages/cards/CardsPublic'
import Loans from '../../components/PublicPages/loans/Loans'
import Deposits from '../../components/PublicPages/deposits/Deposits'
import Cashback from '../../components/PublicPages/cashback/Cashback'
import SupportPublic from '../../components/PublicPages/support/SupportPublic'

import UserLayout from '../../components/UserPages/UserLayout'
import Dashboard from '../../components/UserPages/dashboard/Dashboard'
import Cards from '../../components/UserPages/cards/Cards'
import Payments from '../../components/UserPages/payments/Payments'
import History from '../../components/UserPages/history/History'
import Settings from '../../components/UserPages/settings/Settings'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cards" element={<CardsPublic />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/deposits" element={<Deposits />} />
        <Route path="/deposits/create" element={<Navigate to="/deposits" replace />} />
        <Route path="/cashback" element={<Cashback />} />
        <Route path="/support" element={<SupportPublic />} />

        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cards" element={<Cards />} />
          <Route path="payments" element={<Payments />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter


