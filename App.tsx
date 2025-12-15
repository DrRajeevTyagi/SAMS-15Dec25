
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import { SchoolProvider, useSchool } from './context/SchoolContext';

// Lazy Load Components to isolate failures
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const StudentList = React.lazy(() => import('./components/StudentList'));
const StudentProfile = React.lazy(() => import('./components/StudentProfile'));
const TeacherProfile = React.lazy(() => import('./components/TeacherProfile'));
const AiTools = React.lazy(() => import('./components/AiTools'));
const Academics = React.lazy(() => import('./components/Academics'));
const Events = React.lazy(() => import('./components/Events'));
const EventDetails = React.lazy(() => import('./components/EventDetails'));
const Staff = React.lazy(() => import('./components/Staff'));
const AcademicAdmin = React.lazy(() => import('./components/AcademicAdmin'));
const Settings = React.lazy(() => import('./components/Settings'));
const HouseManager = React.lazy(() => import('./components/HouseManager'));
const Community = React.lazy(() => import('./components/Community'));
const Circulars = React.lazy(() => import('./components/Circulars')); // NEW COMPONENT

// Simple Loading Spinner Component
const Loading = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-school-200 border-t-school-600"></div>
  </div>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useSchool();

  if (!currentUser) {
      return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
    const { currentUser } = useSchool();

    return (
        <Routes>
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
            
            <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/admin-console" element={<ProtectedLayout><AcademicAdmin /></ProtectedLayout>} />
            <Route path="/students" element={<ProtectedLayout><StudentList /></ProtectedLayout>} />
            <Route path="/students/:id" element={<ProtectedLayout><StudentProfile /></ProtectedLayout>} />
            <Route path="/my-profile" element={<ProtectedLayout><TeacherProfile /></ProtectedLayout>} />
            <Route path="/staff" element={<ProtectedLayout><Staff /></ProtectedLayout>} />
            <Route path="/houses" element={<ProtectedLayout><HouseManager /></ProtectedLayout>} />
            <Route path="/academics" element={<ProtectedLayout><Academics /></ProtectedLayout>} />
            <Route path="/events" element={<ProtectedLayout><Events /></ProtectedLayout>} />
            <Route path="/events/:id" element={<ProtectedLayout><EventDetails /></ProtectedLayout>} />
            <Route path="/community" element={<ProtectedLayout><Community /></ProtectedLayout>} />
            <Route path="/ai-tools" element={<ProtectedLayout><AiTools /></ProtectedLayout>} />
            <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
            <Route path="/circulars" element={<ProtectedLayout><Circulars /></ProtectedLayout>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <SchoolProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SchoolProvider>
  );
};

export default App;
