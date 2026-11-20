import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import StudentLayout from './layouts/StudentLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import UploadPage from './pages/Upload';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<StudentLayout />}>
            <Route index element={<Landing />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="browse" element={<Browse />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="auth" element={<Auth />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
