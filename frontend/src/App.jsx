import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ClinicProvider } from './contexts/ClinicContext';
import AdminConfig from './pages/admin/AdminConfig';
import MedicineAdmin from './pages/admin/MedicineAdmin';
import MedicineMasterDashboard from './pages/admin/MedicineMasterDashboard';
import HomePage from './pages/home/HomePage';
import Dashboard from './pages/Dashboard';
import Consultation from './pages/doctor/Consultation';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorQueue from './pages/doctor/DoctorQueue';
import TemplateEdit from './pages/doctor/TemplateEdit';
import LabDashboard from './pages/lab/LabDashboard';
import PendingTests from './pages/lab/PendingTests';
import Login from './pages/Login';
import PatientRegistration from './pages/reception/PatientRegistration';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import SettingsDashboard from './pages/settings/SettingsDashboard';
import ReportsDashboard from './pages/reports/ReportsDashboard';

function App() {
  return (
    <ClinicProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <HomePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/register"
              element={
                <ProtectedRoute allowedRoles={['reception', 'admin', 'doctor']}>
                  <AppLayout>
                    <PatientRegistration />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/reception" element={<Navigate to="/reception/register" replace />} />
            <Route path="/reception/opd" element={<Navigate to="/reception/register" replace />} />
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <AppLayout>
                    <DoctorDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/doctor" element={<Navigate to="/doctor/queue" replace />} />
            <Route path="/doctor/desk" element={<Navigate to="/doctor/queue" replace />} />
            <Route
              path="/doctor/consultation/:visitId"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <AppLayout>
                    <Consultation />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/template/new"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <AppLayout>
                    <TemplateEdit />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/template/:templateId"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <AppLayout>
                    <TemplateEdit />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab"
              element={
                <ProtectedRoute allowedRoles={['lab', 'admin', 'doctor']}>
                  <AppLayout>
                    <LabDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/tests"
              element={
                <ProtectedRoute allowedRoles={['lab', 'admin', 'doctor']}>
                  <AppLayout>
                    <LabDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/lab/dashboard" element={<Navigate to="/lab" replace />} />
            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute allowedRoles={['pharmacy', 'admin', 'doctor']}>
                  <AppLayout>
                    <PharmacyDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/pharmacy/pos" element={<Navigate to="/pharmacy" replace />} />
            <Route path="/pharmacy/inventory" element={<Navigate to="/pharmacy" replace />} />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReportsDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medicines"
              element={
                <ProtectedRoute allowedRoles={['admin', 'pharmacy', 'doctor']}>
                  <AppLayout>
                    <MedicineMasterDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medicine-master"
              element={
                <ProtectedRoute allowedRoles={['admin', 'pharmacy', 'doctor']}>
                  <AppLayout>
                    <MedicineMasterDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/medicine-master"
              element={
                <ProtectedRoute allowedRoles={['admin', 'pharmacy', 'doctor']}>
                  <AppLayout>
                    <MedicineMasterDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ClinicProvider>
  );
}

export default App;
