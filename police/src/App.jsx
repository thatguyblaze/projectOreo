import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import PortalLayout from './layouts/PortalLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import News from './pages/public/News';
import PortalDashboard from './pages/portal/Dashboard';
import DispatchCAD from './pages/portal/DispatchCAD';
import CaseManager from './pages/portal/CaseManager';
import EvidenceLocker from './pages/portal/EvidenceLocker';
import DutyRoster from './pages/portal/DutyRoster';
import BoloBoard from './pages/portal/BoloBoard';
import TicketWriter from './pages/portal/TicketWriter';

// Temporary Placeholders
const Placeholder = ({ title }) => <div className="p-8"><h1>{title}</h1><p>Under Construction</p></div>;

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/news" element={<News />} />
            <Route path="/resources" element={<Placeholder title="Services & Resources" />} />
            <Route path="/careers" element={<Placeholder title="Recruitment" />} />
          </Route>

          {/* Login Route (Outside Layouts) */}
          <Route path="/login" element={<Login />} />

          {/* Secure Portal Routes */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PortalDashboard />} />
            <Route path="dispatch" element={<DispatchCAD />} />
            <Route path="citations" element={<TicketWriter />} />
            <Route path="evidence" element={<EvidenceLocker />} />
            <Route path="reports" element={<CaseManager />} />
            <Route path="roster" element={<DutyRoster />} />
            <Route path="bolo" element={<BoloBoard />} />
            <Route path="settings" element={<Placeholder title="System Settings" />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
