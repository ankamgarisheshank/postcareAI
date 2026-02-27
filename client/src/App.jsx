import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PatientMapPage from './pages/PatientMapPage';

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

function AppContent() {
  const location = useLocation();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/map" element={<PatientMapPage />} />
              <Route path="/patients/add" element={<PatientFormPage />} />
              <Route path="/patients/edit/:id" element={<PatientFormPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
