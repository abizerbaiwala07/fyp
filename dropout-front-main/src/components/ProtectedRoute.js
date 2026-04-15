import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, requireAuth = true, requireFormCompletion = false }) => {
  const { currentUser, profileCompleted, userProfile, loading } = useAuth();
  const location = useLocation();

  // Get student info from profile if available
  const studentId = userProfile?.studentId || localStorage.getItem('demoStudentId');

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
  if (requireAuth && !currentUser) {
    // Redirect to login page, but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if form completion is required
  if (requireFormCompletion && !profileCompleted) {
    // Redirect to form completion
    return <Navigate to="/comprehensive-form" replace />;
  }

  // If user has completed form and is trying to access the form again, redirect to dashboard
  if (profileCompleted && studentId && location.pathname === '/comprehensive-form') {
    return <Navigate to={`/student-dashboard/${studentId}`} replace />;
  }

  return children;
};

export default ProtectedRoute;