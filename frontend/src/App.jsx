import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Onboarding
import LocationSetup from './pages/LocationSetup'

// Dashboard
import DashboardLoader from './pages/dashboard/DashboardLoader'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import FarmersPulse from './pages/dashboard/FarmersPulse'
import MyFarm from './pages/dashboard/MyFarm'

// Placeholder for unbuilt pages
function ComingSoon({ title }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: '1rem',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: '3rem' }}>🚧</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: '#1a1a1a' }}>
        {title}
      </h2>
      <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
        Coming soon — we're building this for you.
      </p>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding */}
        <Route path="/location-setup" element={<LocationSetup />} />

        {/* Dashboard loading screen */}
        <Route path="/loading" element={<DashboardLoader />} />

        {/* Dashboard — nested routes inside the layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<FarmersPulse />} />
          <Route path="farm" element={<MyFarm />} />
          <Route path="crops" element={<ComingSoon title="Crop Intelligence" />} />
          <Route path="alerts" element={<ComingSoon title="Climate Alerts" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App