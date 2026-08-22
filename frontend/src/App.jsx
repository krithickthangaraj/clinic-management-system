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
import Dashboard from './pages/Dashboard';
import Consultation from './pages/doctor/Consultation';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorQueue from './pages/doctor/DoctorQueue';
import TemplateEdit from './pages/doctor/TemplateEdit';
import PendingTests from './pages/lab/PendingTests';
import Login from './pages/Login';
import PatientRegistration from './pages/reception/PatientRegistration';

function App() {
  return (
    <ClinicProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/register"
              element={
                <ProtectedRoute allowedRoles={['reception', 'admin']}>
                  <AppLayout>
                    <PatientRegistration />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
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
              path="/lab/tests"
              element={
                <ProtectedRoute allowedRoles={['lab', 'admin']}>
                  <AppLayout>
                    <PendingTests />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminConfig />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medicines"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <MedicineAdmin />
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
