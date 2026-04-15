import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  LinearProgress,
  alpha
} from '@mui/material';
import { 
  ArrowBack,
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  School,
  AutoAwesome
} from '@mui/icons-material';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) navigate('/dashboard');
    });
    return () => unsub();
  }, [navigate]);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!displayName.trim()) { setError('Please enter your full name'); return; }
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (passwordStrength < 50) { setError('Please choose a stronger password'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(cred.user, { displayName });
      try {
        const idToken = await cred.user.getIdToken();
        await authAPI.firebaseAuthLogin(idToken);
        navigate('/dashboard');
      } catch (backendError) {
        console.error('Backend sync error:', backendError);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Signup error:', err);
      let errorMessage = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') errorMessage = 'An account already exists with this email address.';
      else if (err.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
      else if (err.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters.';
      else if (err.code === 'auth/too-many-requests') errorMessage = 'Too many requests. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      try {
        const idToken = await result.user.getIdToken();
        await authAPI.googleVerify({ id_token: idToken });
      } catch (backendError) {
        console.error('Backend sync error:', backendError);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Google signup error:', err);
      let errorMessage = 'Google sign-up failed. Please try again.';
      if (err.code === 'auth/popup-blocked') errorMessage = 'Popup blocked by browser. Please allow popups and try again.';
      else if (err.code === 'auth/account-exists-with-different-credential') errorMessage = 'An account already exists with this email. Please sign in using your original method.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--bg-dark)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Dynamic Background */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 10% 20%, ${alpha('#b026ff', 0.1)} 0%, transparent 40%),
                     radial-gradient(circle at 90% 80%, ${alpha('#00cc55', 0.1)} 0%, transparent 40%)`,
        zIndex: 0
      }} />

      {/* Floating Shapes */}
      <Box component={motion.div} animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        sx={{ position: 'absolute', width: '30vh', height: '30vh', borderRadius: '50%', background: alpha('#00f0ff', 0.05), filter: 'blur(50px)', top: '-10%', right: '10%', zIndex: 0 }} />
      <Box component={motion.div} animate={{ y: [0, 40, 0], rotate: [0, -10, 0] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        sx={{ position: 'absolute', width: '40vh', height: '40vh', borderRadius: '50%', background: alpha('#b026ff', 0.05), filter: 'blur(60px)', bottom: '-15%', left: '5%', zIndex: 0 }} />

      <Grid container sx={{ zIndex: 1, position: 'relative' }}>
        
        {/* Left Branding Panel (Desktop Only) */}
        <Grid item xs={12} md={5} lg={6} sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', p: 6, justifyContent: 'center' }}>
          <Box component={motion.div} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <School sx={{ fontSize: 40, color: 'var(--neon-green)', mr: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: 1 }}>SDPM</Typography>
            </Box>
            
            <Typography variant="h2" sx={{ fontWeight: 900, mb: 3, lineHeight: 1.1, color: 'white' }}>
              Take control of <br/>
              <span style={{ background: 'linear-gradient(to right, var(--neon-green), var(--neon-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your future</span> <br/>
              today.
            </Typography>

            <Typography variant="h6" sx={{ color: 'var(--text-secondary)', fontWeight: 400, maxWidth: 500, mb: 5 }}>
              Join thousands of students utilizing our advanced AI tools to stay on track and maximize academic potential.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--neon-purple)', backgroundColor: 'rgba(176, 38, 255, 0.1)', py: 1, px: 2, borderRadius: 2, width: 'fit-content', border: '1px solid rgba(176, 38, 255, 0.2)' }}>
              <AutoAwesome sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Create Your Account Free</Typography>
            </Box>
          </Box>
        </Grid>

        {/* Right Form Panel */}
        <Grid item xs={12} md={7} lg={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4, md: 6 } }}>
          <Box component={motion.div} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} sx={{ width: '100%', maxWidth: 500 }}>
            
            <Button startIcon={<ArrowBack />} component={Link} to="/" sx={{ color: 'var(--text-secondary)', mb: 3, '&:hover': { color: 'var(--neon-green)', background: 'transparent' } }}>
              Back to Home
            </Button>

            <Box className="glass-panel" sx={{ p: { xs: 4, sm: 5 }, borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <Box mb={4}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'white' }}>Join Us Today 🚀</Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>Transform education with AI-powered insights.</Typography>
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

              <Box component="form" onSubmit={handleEmailSignup}>
                
                {/* Full Name */}
                <Box mb={2.5}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, display: 'block' }}>FULL NAME</Typography>
                  <TextField fullWidth value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="John Doe"
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'var(--text-secondary)' }} /></InputAdornment> }}
                    sx={{
                      '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--neon-green)', borderWidth: '2px' },
                        '&.Mui-focused .MuiSvgIcon-root': { color: 'var(--neon-green)' }
                      }
                    }}
                  />
                </Box>

                {/* Email Field */}
                <Box mb={2.5}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, display: 'block' }}>EMAIL ADDRESS</Typography>
                  <TextField fullWidth type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="student@university.edu"
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'var(--text-secondary)' }} /></InputAdornment> }}
                    sx={{
                      '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--neon-blue)', borderWidth: '2px' },
                        '&.Mui-focused .MuiSvgIcon-root': { color: 'var(--neon-blue)' }
                      }
                    }}
                  />
                </Box>
                
                {/* Password Field */}
                <Box mb={4}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, display: 'block' }}>PASSWORD</Typography>
                  <TextField fullWidth type={showPassword ? 'text' : 'password'} value={password} onChange={handlePasswordChange} required placeholder="••••••••"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: 'var(--text-secondary)' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton></InputAdornment>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 2, mb: 1,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--neon-purple)', borderWidth: '2px' },
                        '&.Mui-focused .MuiInputAdornment-positionStart .MuiSvgIcon-root': { color: 'var(--neon-purple)' }
                      }
                    }}
                  />
                  {password && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Strength</Typography>
                        <Typography variant="caption" sx={{ color: passwordStrength < 50 ? '#ff0055' : passwordStrength < 75 ? 'var(--neon-orange)' : 'var(--neon-green)' }}>
                          {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={passwordStrength} sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: passwordStrength < 50 ? '#ff0055' : passwordStrength < 75 ? 'var(--neon-orange)' : 'var(--neon-green)' } }} />
                    </Box>
                  )}
                </Box>
                
                <Button type="submit" fullWidth disabled={loading} component={motion.button} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  sx={{ py: 1.8, fontSize: '1rem', fontWeight: 700, borderRadius: 2, color: 'white',
                    background: 'linear-gradient(90deg, var(--neon-green) 0%, var(--neon-blue) 100%)', boxShadow: '0 8px 20px rgba(0, 240, 255, 0.3)',
                    border: 'none', cursor: loading ? 'default' : 'pointer', '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' } }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', my: 4 }}>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="caption" sx={{ px: 2, color: 'var(--text-secondary)' }}>OR CONTINUE WITH</Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              </Box>

              <Button fullWidth onClick={handleGoogleSignup} disabled={loading} startIcon={<GoogleIcon />} component={motion.button} whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.98 }}
                sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 600, borderRadius: 2, color: 'white', backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', cursor: loading ? 'default' : 'pointer', '&:disabled': { opacity: 0.5 } }}>
                Google Identity
              </Button>
              
              <Box textAlign="center" mt={3}>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <Typography component={Link} to="/login" sx={{ color: 'var(--neon-green)', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Sign in here
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

export default Signup;