import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientRegisterPage from './pages/PatientRegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PatientMapPage from './pages/PatientMapPage';
import MyRecoveryPage from './pages/MyRecoveryPage';
import MessagesPage from './pages/MessagesPage';
import CallLogsPage from './pages/CallLogsPage';

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Smart redirect based on role
const RoleRedirect = () => {
  const { isDoctor, isPatient } = useAuth();
  if (isPatient) return <Navigate to="/my-recovery" replace />;
  return <Navigate to="/dashboard" replace />;
};

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
          <Route path="/register/patient" element={<PatientRegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Doctor routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/map" element={<PatientMapPage />} />
              <Route path="/patients/add" element={<PatientFormPage />} />
              <Route path="/patients/edit/:id" element={<PatientFormPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/call-logs" element={<CallLogsPage />} />
              {/* Patient routes */}
              <Route path="/my-recovery" element={<MyRecoveryPage />} />
            </Route>
          </Route>

          {/* Role-based redirect */}
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<RoleRedirect />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
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
