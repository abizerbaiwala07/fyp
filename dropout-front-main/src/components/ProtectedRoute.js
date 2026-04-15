import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, requireAuth = true, requireFormCompletion = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Get user info from localStorage (fallback)
  const userEmail = localStorage.getItem('userEmail');
  const hasCompletedForm = localStorage.getItem('formCompleted') === 'true';
  const studentId = localStorage.getItem('demoStudentId');

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if authentication is required
  if (requireAuth && !currentUser && !userEmail) {
    // Redirect to login page, but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if form completion is required
  if (requireFormCompletion && (!hasCompletedForm || !studentId)) {
    // Redirect to form completion
    return <Navigate to="/comprehensive-form" replace />;
  }

  // If user has completed form and is trying to access the form again, redirect to dashboard
  if (hasCompletedForm && studentId && location.pathname === '/comprehensive-form') {
    return <Navigate to={`/student-dashboard/${studentId}`} replace />;
  }

  return children;
};

export default ProtectedRoute;