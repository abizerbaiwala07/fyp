import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert, Button, Paper } from '@mui/material';
import { Person as PersonIcon, School as SchoolIcon, Warning as WarningIcon } from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboardWrapper = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setLoading(true);

        // Check dashboard status from backend
        try {
          const dashboardResponse = await authAPI.getDashboard();
          const dashboardData = dashboardResponse.data;

          if (!isMounted) return;

          if (dashboardData.form_completed && dashboardData.student_id) {
            navigate(dashboardData.redirect_to);
            return;
          } else {
            setError(dashboardData.message || 'Please complete the assessment form first.');
            setLoading(false);
          }
        } catch (apiError) {
          // Fallback to localStorage check
          const hasCompletedForm = localStorage.getItem('formCompleted') === 'true';
          const studentId = localStorage.getItem('demoStudentId');

          if (hasCompletedForm && studentId) {
            navigate(`/student-dashboard/${studentId}`);
            return;
          }

          if (isMounted) setLoading(false);
        }
      } catch (err) {
        console.error('Error checking user form status:', err);
        if (isMounted) {
          setError('Error loading dashboard. Please try again.');
          setLoading(false);
        }
      }
    };

    run();
    return () => { isMounted = false; };
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <SchoolIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Welcome to Student Dashboard
          </Typography>
        </Box>
        
        <Alert 
          severity="warning" 
          icon={<WarningIcon fontSize="inherit" />}
          sx={{ 
            mb: 4, 
            textAlign: 'left',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Assessment Form Required
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              To access your personalized dashboard with academic insights and recommendations, 
              you need to complete the student assessment form first.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <WarningIcon sx={{ mr: 1, color: 'warning.dark' }} />
              <Typography variant="body2">
                <strong>Important:</strong> This information helps us provide you with accurate recommendations 
                and track your academic progress effectively.
              </Typography>
            </Box>
          </Box>
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<PersonIcon />} 
            onClick={() => navigate('/comprehensive-form')} 
            sx={{ 
              px: 4, 
              py: 1.5,
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            Complete Assessment Form
          </Button>
          

        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Completing this form takes approximately 5-10 minutes and provides valuable insights 
            for your academic journey.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentDashboardWrapper;