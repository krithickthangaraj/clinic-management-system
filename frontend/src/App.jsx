import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientRegistration from './pages/reception/PatientRegistration'
import DoctorQueue from './pages/doctor/DoctorQueue'
import Consultation from './pages/doctor/Consultation'
import PendingTests from './pages/lab/PendingTests'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reception/register"
            element={
              <ProtectedRoute allowedRoles={['reception', 'admin']}>
                <PatientRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/queue"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <DoctorQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consultation/:visitId"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                <Consultation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab/tests"
            element={
              <ProtectedRoute allowedRoles={['lab', 'admin']}>
                <PendingTests />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
