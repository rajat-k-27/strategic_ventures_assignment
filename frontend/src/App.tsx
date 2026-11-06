import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './pages/PatientDashboard';
import { PatientRegistration } from './pages/PatientRegistration';
import { ClinicalAssessment } from './pages/ClinicalAssessment';
import { GoalManagement } from './pages/GoalManagement';
import { RAPCreation } from './pages/RAPCreation';
import { RAPApprovalDashboard } from './pages/RAPApprovalDashboard';
import { Login } from './pages/Login';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-semibold">
        Initializing clinical workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Rehabilitation Action Plan Management • Full Stack Technical Assessment
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <PatientDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/patients/register"
            element={
              <ProtectedLayout>
                <PatientRegistration />
              </ProtectedLayout>
            }
          />
          <Route
            path="/assessments"
            element={
              <ProtectedLayout>
                <ClinicalAssessment />
              </ProtectedLayout>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedLayout>
                <GoalManagement />
              </ProtectedLayout>
            }
          />
          <Route
            path="/raps/create"
            element={
              <ProtectedLayout>
                <RAPCreation />
              </ProtectedLayout>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedLayout>
                <RAPApprovalDashboard />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

