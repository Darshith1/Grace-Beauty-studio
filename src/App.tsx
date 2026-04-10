import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CustomerChrome } from './components/CustomerChrome'
import { HomePage } from './pages/HomePage'
import { ServiceMenuPage } from './pages/book/ServiceMenuPage'
import { StaffSelectPage } from './pages/book/StaffSelectPage'
import { AddonsPage } from './pages/book/AddonsPage'
import { DateTimePage } from './pages/book/DateTimePage'
import { CheckoutPage } from './pages/book/CheckoutPage'
import { ConfirmationPage } from './pages/book/ConfirmationPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminServicesPage } from './pages/admin/AdminServicesPage'
import { AdminStylistsPage } from './pages/admin/AdminStylistsPage'
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage'
import { AdminAppointmentDetailPage } from './pages/admin/AdminAppointmentDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerChrome />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/services" element={<ServiceMenuPage />} />
          <Route path="/book/staff/:serviceId" element={<StaffSelectPage />} />
          <Route path="/book/addons" element={<AddonsPage />} />
          <Route path="/book/datetime" element={<DateTimePage />} />
          <Route path="/book/checkout" element={<CheckoutPage />} />
          <Route path="/book/confirmation/:id" element={<ConfirmationPage />} />
        </Route>
        <Route path="/book" element={<Navigate to="/book/services" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="services" element={<AdminServicesPage />} />
          <Route path="stylists" element={<AdminStylistsPage />} />
          <Route path="appointments" element={<AdminAppointmentsPage />} />
          <Route path="appointments/:id" element={<AdminAppointmentDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
