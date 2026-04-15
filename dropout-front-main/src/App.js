import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Analytics from './pages/Analytics';
import TenthStandardForm from './pages/TenthStandardForm';
import ComprehensiveStudentForm from './pages/ComprehensiveStudentForm';
import StudentDashboard from './pages/StudentDashboardModern';
import StudentDashboardWrapper from './pages/StudentDashboardWrapper';
import AchievementsGuide from './pages/AchievementsGuide';
import QuizGenerator from './pages/QuizGenerator';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#2196f3', dark: '#1565c0', light: '#64b5f6' },
    secondary: { main: '#f50057', dark: '#c51162', light: '#ff5983' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)' },
  },
  typography: { h4: { fontWeight: 600 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 } },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary>
            <Routes>
              {/* Public routes without navbar */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes with navbar */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <StudentDashboardWrapper />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/students" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <Students />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/student/:id" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <StudentDetail />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/achievements/:studentId" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <AchievementsGuide />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/analytics" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <Analytics />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/tenth-standard-form" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <TenthStandardForm />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/comprehensive-form" element={
                <ProtectedRoute requireAuth={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <ComprehensiveStudentForm />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
              
              <Route path="/student-dashboard/:studentId" element={
                <ProtectedRoute requireAuth={true} requireFormCompletion={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <StudentDashboard />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />

              <Route path="/quiz-generator/:studentId" element={
                <ProtectedRoute requireAuth={true} requireFormCompletion={true}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                      <QuizGenerator />
                    </Box>
                  </Box>
                </ProtectedRoute>
              } />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;