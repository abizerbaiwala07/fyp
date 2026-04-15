import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Button,
  Typography,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  alpha
} from '@mui/material';
import { 
  ArrowBack,
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AutoAwesome,
  School
} from '@mui/icons-material';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileCompleted, userProfile, checkProfileCompletion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // This useEffect handles initial load/refresh redirects
    // Only redirect if we are purely on the login page and fully loaded
    if (user && profileCompleted && (location.pathname === '/login' || location.pathname === '/signup')) {
      const studentId = userProfile?.studentId || localStorage.getItem('demoStudentId');
      
      // If we have a previous location, go there, otherwise go to dashboard
      const from = location.state?.from?.pathname;
      
      if (from && from !== '/login' && from !== '/signup') {
        navigate(from, { replace: true });
      } else if (studentId) {
        navigate(`/student-dashboard/${studentId}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profileCompleted, userProfile, navigate, location.pathname, location.state]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const response = await authAPI.firebaseAuthLogin(idToken);
      
      // Immediately update auth context with backend profile status
      const isCompleted = await checkProfileCompletion(cred.user, response.data.user);
      
      if (isCompleted && response.data.user.student_id) {
        navigate(`/student-dashboard/${response.data.user.student_id}`);
      } else {
        navigate('/comprehensive-form');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Failed to login. Please try again.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const response = await authAPI.googleVerify({ id_token: idToken });
      
      // Use backend truth to determine redirect
      const isCompleted = await checkProfileCompletion(result.user, response.data.user);
      
      if (isCompleted && response.data.user.student_id) {
        navigate(`/student-dashboard/${response.data.user.student_id}`);
      } else {
        navigate('/comprehensive-form');
      }
    } catch (err) {
      console.error('Google login error:', err);
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked by browser. Please allow popups and try again.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email. Please sign in using your original method.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        bgcolor: 'var(--bg-dark)',
        display: 'flex', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 10% 20%, ${alpha('#b026ff', 0.1)} 0%, transparent 40%),
                     radial-gradient(circle at 90% 80%, ${alpha('#00f0ff', 0.1)} 0%, transparent 40%)`,
        zIndex: 0
      }} />

      {/* Floating Shapes */}
      <Box component={motion.div} 
        animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute', width: '30vh', height: '30vh',
          borderRadius: '50%', background: alpha('#00f0ff', 0.05),
          filter: 'blur(50px)', top: '-10%', right: '10%', zIndex: 0
        }} 
      />
      
      <Box component={motion.div} 
        animate={{ y: [0, 40, 0], rotate: [0, -10, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        sx={{
          position: 'absolute', width: '40vh', height: '40vh',
          borderRadius: '50%', background: alpha('#b026ff', 0.05),
          filter: 'blur(60px)', bottom: '-15%', left: '5%', zIndex: 0
        }} 
      />

      <Grid container sx={{ zIndex: 1, position: 'relative' }}>
        
        {/* Left Branding Panel (Desktop Only) */}
        <Grid item xs={12} md={5} lg={6} sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', p: 6, justifyContent: 'center' }}>
          <Box component={motion.div} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <School sx={{ fontSize: 40, color: 'var(--neon-blue)', mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: 1 }}>
                SDPM
              </Typography>
            </Box>
            
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, lineHeight: 1.1, color: 'white' }}>
              Your personalized <br/>
              <span style={{ 
                background: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple))', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>learning journey</span> <br/>
              starts here.
            </Typography>

            <Typography variant="h6" sx={{ color: 'var(--text-secondary)', fontWeight: 400, maxWidth: 500, mb: 5 }}>
              The Student Dropout Prediction System analyzes your academics to provide real-time guidance and ensure your success.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--neon-green)', backgroundColor: 'rgba(0,255,102,0.1)', py: 1, px: 2, borderRadius: 2, width: 'fit-content', border: '1px solid rgba(0,255,102,0.2)' }}>
              <AutoAwesome sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Powered by AI Academic Advisor</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Right Form Panel */}
        <Grid item xs={12} md={7} lg={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4, md: 6 } }}>
          <Box component={motion.div} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} sx={{ width: '100%', maxWidth: 500 }}>
            
            <Button 
              startIcon={<ArrowBack />} 
              component={Link}
              to="/"
              sx={{ color: 'var(--text-secondary)', mb: 4, '&:hover': { color: 'var(--neon-blue)', background: 'transparent' } }}
            >
              Back to Home
            </Button>

            <Box className="glass-panel" sx={{ p: { xs: 4, sm: 5 }, borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              
              <Box mb={4}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'white' }}>
                  Welcome back 👋
                </Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                  Ready to continue your progress? Please enter your details to sign in.
                </Typography>
              </Box>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(255,0,85,0.1)', color: '#ff0055', border: '1px solid rgba(255,0,85,0.3)', '& .MuiAlert-icon': { color: '#ff0055' } }}>
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Box component="form" onSubmit={handleEmailLogin}>
                
                {/* Email Field */}
                <Box mb={3}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, display: 'block' }}>EMAIL ADDRESS</Typography>
                  <TextField 
                    fullWidth 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    placeholder="student@university.edu"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Email sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--neon-blue)', borderWidth: '2px' },
                        '&.Mui-focused .MuiSvgIcon-root': { color: 'var(--neon-blue)' }
                      }
                    }}
                  />
                </Box>
                
                {/* Password Field */}
                <Box mb={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>PASSWORD</Typography>
                    <Typography component={Link} to="/forgot-password" variant="caption" sx={{ color: 'var(--neon-blue)', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Forgot pattern?
                    </Typography>
                  </Box>
                  <TextField 
                    fullWidth 
                    type={showPassword ? 'text' : 'password'}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    placeholder="••••••••"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'var(--text-secondary)' }}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--neon-purple)', borderWidth: '2px' },
                        '&.Mui-focused .MuiInputAdornment-positionStart .MuiSvgIcon-root': { color: 'var(--neon-purple)' }
                      }
                    }}
                  />
                </Box>
                
                <FormControlLabel
                  control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: 'var(--neon-blue)' } }} />}
                  label={<Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Remember me for 30 days</Typography>}
                  sx={{ mb: 4 }}
                />
                
                <Button 
                  type="submit" 
                  fullWidth 
                  disabled={loading}
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    color: 'white',
                    background: 'linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
                    boxShadow: '0 8px 20px rgba(176, 38, 255, 0.3)',
                    border: 'none',
                    cursor: loading ? 'default' : 'pointer',
                    '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Initialize Session'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', my: 4 }}>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="caption" sx={{ px: 2, color: 'var(--text-secondary)' }}>OR CONTINUE WITH</Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              </Box>

              <Button 
                fullWidth 
                onClick={handleGoogleLogin}
                disabled={loading}
                startIcon={<GoogleIcon />}
                component={motion.button}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: loading ? 'default' : 'pointer',
                  '&:disabled': { opacity: 0.5 }
                }}
              >
                Google Identity
              </Button>
              
              <Box textAlign="center" mt={4}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  New here?{' '}
                  <Typography component={Link} to="/signup" sx={{ color: 'var(--neon-green)', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Create an account
                  </Typography>
                </Typography>
              </Box>

            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;