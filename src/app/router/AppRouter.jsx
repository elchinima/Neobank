import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from '../../pages/landing/Landing'
import Login from '../../pages/auth/Login'
import Register from '../../pages/auth/Register'
import CardsPublic from '../../pages/cards/CardsPublic'
import Loans from '../../pages/loans/Loans'
import Deposits from '../../pages/deposits/Deposits'
import Cashback from '../../pages/cashback/Cashback'
import SupportPublic from '../../pages/support/SupportPublic'

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
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
