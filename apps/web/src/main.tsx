import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import RootPage from './pages/(root)/page'
import DashboardPage from './pages/dashboard/page'
import DashboardLayout from './pages/dashboard/layout'
import AdminMQTTBrokerPage from './pages/dashboard/admin/mqtt-broker/page'
import AdminLayout from './pages/dashboard/admin/layout'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<RootPage />} />
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route path="mqtt-broker" element={<AdminMQTTBrokerPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
