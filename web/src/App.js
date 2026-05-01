import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { getMe } from './redux/slices/authSlice';

// Layout
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import CodeGen from './pages/CodeGen';
import Profile from './pages/Profile';
import Assignments from './pages/Assignments';
import Sections from './pages/Sections';
import SectionsPage from './pages/SectionsPage';
import StudentSectionsPage from './pages/StudentSectionsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import TeacherAssignmentsPage from './pages/TeacherAssignmentsPage';

function App() {
  const dispatch = useDispatch();
  const { token, isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getMe());
    }
  }, [dispatch, token, isAuthenticated]);

  if (token && !user) {
    return null; // Don't show anything until user is loaded
  }

  return (
    <div className="App">
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={
            user?.role === 'teacher' ? <TeacherDashboard /> :
            user?.role === 'admin' ? <AdminDashboard /> :
            <StudentDashboard />
          } />
          <Route path="/messages" element={<Messages />} />
          <Route path="/codegen" element={<CodeGen />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/assignments" element={
            user?.role === 'teacher' ? <TeacherAssignmentsPage /> : <AssignmentsPage />
          } />
          <Route path="/sections" element={<Sections />} />
          <Route path="/teacher-sections" element={<SectionsPage />} />
          <Route path="/student-sections" element={<StudentSectionsPage />} />
          <Route path="/assignments/:sectionId" element={
            user?.role === 'teacher' ? <TeacherAssignmentsPage /> : <AssignmentsPage />
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;

