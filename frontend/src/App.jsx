import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import LiveAttendance from './pages/LiveAttendance';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherSessionPage from './pages/TeacherSessionPage';
import SessionHistory from './pages/SessionHistory';
import StudentProfile from './pages/StudentProfile';
import StudentSubjects from './pages/StudentSubjects';
import StudentCalendar from './pages/StudentCalendar';
import StudentFaceProfile from './pages/StudentFaceProfile';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const decoded = jwtDecode(token);
    const userRole = decoded.role || 'ADMIN';
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      if (userRole === 'TEACHER') return <Navigate to="/teacher" replace />;
      if (userRole === 'STUDENT') return <Navigate to="/student" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRedirect = () => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    try {
        const decoded = jwtDecode(token);
        if (decoded.role === 'TEACHER') return <Navigate to="/teacher" replace />;
        if (decoded.role === 'STUDENT') return <Navigate to="/student" replace />;
        return <Navigate to="/dashboard" replace />;
    } catch {
        return <Navigate to="/login" replace />;
    }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        
        {}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          
          <Route path="/app" element={<AppRedirect />} />
          
          {}
          <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Dashboard />
              </ProtectedRoute>
          } />
          {}
          <Route path="/students" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <Students />
              </ProtectedRoute>
          } />
          
          {}
          <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <TeacherDashboard />
              </ProtectedRoute>
          } />
          <Route path="/session/:sessionId" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <TeacherSessionPage />
              </ProtectedRoute>
          } />
          <Route path="/session-history" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <SessionHistory />
              </ProtectedRoute>
          } />
          <Route path="/live" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <LiveAttendance />
              </ProtectedRoute>
          } />
          <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <Reports />
              </ProtectedRoute>
          } />

          <Route path="/students/:studentId" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                  <StudentProfile />
              </ProtectedRoute>
          } />

          <Route path="/student" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT']}>
                  <StudentDashboard />
              </ProtectedRoute>
          } />
          <Route path="/student/subjects" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentSubjects />
              </ProtectedRoute>
          } />
          <Route path="/student/calendar" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentCalendar />
              </ProtectedRoute>
          } />
          <Route path="/student/face" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentFaceProfile />
              </ProtectedRoute>
          } />

          {}
          <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
                  <Profile />
              </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
