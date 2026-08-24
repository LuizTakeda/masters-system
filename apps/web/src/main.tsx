import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import RootPage from './pages/(root)/page'
import DashboardPage from './pages/dashboard/page'
import DashboardLayout from './pages/dashboard/layout'
import AdminLayout from './pages/dashboard/admin/layout'
import AdminMqttBrokerRouter from './pages/dashboard/admin/mqtt-broker/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<RootPage />} />
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="admin" element={<AdminLayout />}>
            {AdminMqttBrokerRouter()}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
