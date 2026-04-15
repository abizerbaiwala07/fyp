import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Fade,
  Slide,
  Zoom,
  alpha,
  Stack,
  Chip
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  Security,
  Psychology,
  AutoGraph,
  Insights,
  AutoAwesome
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Psychology />,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning algorithms analyze student data to predict dropout risk with 95% accuracy.',
      color: 'var(--neon-purple)'
    },
    {
      icon: <Analytics />,
      title: 'Smart Analytics',
      description: 'Beautiful dashboards and insights help educators make data-driven decisions for student success.',
      color: 'var(--neon-blue)'
    },
    {
      icon: <TrendingUp />,
      title: 'Early Intervention',
      description: 'Identify at-risk students weeks before traditional methods and implement targeted support.',
      color: 'var(--neon-green)'
    },
    {
      icon: <AutoGraph />,
      title: 'Performance Tracking',
      description: 'Monitor academic progress, attendance patterns, and engagement metrics in real-time.',
      color: 'var(--neon-pink)'
    },
    {
      icon: <Insights />,
      title: 'Actionable Insights',
      description: 'Get personalized recommendations and intervention strategies for each student.',
      color: 'var(--neon-orange)'
    },
    {
      icon: <Security />,
      title: 'Secure & Compliant',
      description: 'FERPA compliant with enterprise-grade security protecting sensitive student information.',
      color: 'var(--neon-blue)'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'var(--bg-dark)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Dynamic Background matching login/dashboard */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: `radial-gradient(circle at 10% 20%, ${alpha('#b026ff', 0.1)} 0%, transparent 40%),
                     radial-gradient(circle at 90% 80%, ${alpha('#00f0ff', 0.1)} 0%, transparent 40%)`,
        zIndex: 0
      }} />

      {/* Floating Elements */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: { xs: 40, md: 60 + i * 10 },
            height: { xs: 40, md: 60 + i * 10 },
            borderRadius: '50%',
            background: i % 2 === 0 ? alpha('#00f0ff', 0.05) : alpha('#b026ff', 0.05),
            filter: 'blur(30px)',
            top: `${10 + i * 15}%`,
            left: `${5 + i * 15}%`,
            animation: `float ${8 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            zIndex: 0,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
              '50%': { transform: `translateY(${-20 - i * 5}px) translateX(${10 + i * 2}px)` }
            }
          }}
        />
      ))}

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 8, md: 12 }, pb: 8 }}>
        <Fade in timeout={1000}>
          <Box textAlign="center" mb={8}>
            {/* Status Badge */}
            <Slide direction="down" in timeout={800}>
               <Box mb={3}>
                  <Chip
                    icon={<AutoAwesome />}
                    label="AI-Powered Education Technology"
                    sx={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      color: 'var(--neon-blue)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      fontWeight: 600,
                      p: 1.5,
                      '& .MuiChip-icon': { color: 'var(--neon-blue)' }
                    }}
                  />
               </Box>
            </Slide>
            
            <Slide direction="up" in timeout={1000}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  color: 'white',
                  mb: 2,
                  letterSpacing: '-0.02em'
                }}
              >
                Predict Student Success
                <br />
                <Typography
                  component="span"
                  sx={{
                    background: 'linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: 'inherit',
                    fontWeight: 'inherit'
                  }}
                >
                  Before It's Too Late
                </Typography>
              </Typography>
            </Slide>
            
            <Slide direction="up" in timeout={1200}>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  mb: 5,
                  color: 'var(--text-secondary)',
                  fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                  fontWeight: 400,
                  maxWidth: '700px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Transform education with AI-powered insights that identify at-risk students 
                and provide actionable interventions to ensure every student succeeds.
              </Typography>
            </Slide>

            <Zoom in timeout={1400}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
                sx={{ mt: 4 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{
                    px: 4, py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2,
                    background: 'linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(176, 38, 255, 0.3)',
                    textTransform: 'none',
                    transition: 'all 0.3s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 30px rgba(176, 38, 255, 0.5)' }
                  }}
                >
                  Initialize Platform
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  className="glass-panel"
                  sx={{
                    px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600, borderRadius: 2,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.2)',
                    textTransform: 'none',
                    transition: 'all 0.3s',
                    '&:hover': { background: 'rgba(255,255,255,0.1)', borderColor: 'var(--neon-blue)', transform: 'translateY(-2px)' }
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </Zoom>
          </Box>
        </Fade>

        {/* Features Section */}
        <Fade in timeout={1600}>
          <Box mt={12}>
            <Typography variant="h3" textAlign="center" sx={{ mb: 2, fontWeight: 800, color: 'white' }}>
              Powerful Features for Modern Education
            </Typography>
            <Typography variant="h6" textAlign="center" sx={{ mb: 8, color: 'var(--text-secondary)', maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
              Everything you need to transform student outcomes with data-driven insights
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Slide direction="up" in timeout={1800 + index * 150}>
                    <Box className="glass-panel" sx={{ 
                      height: '100%', 
                      p: 4, 
                      borderRadius: 4, 
                      transition: 'all 0.3s ease',
                      borderTop: `2px solid ${feature.color}40`,
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 15px 30px ${feature.color}20`,
                        borderTop: `2px solid ${feature.color}`
                      }
                    }}>
                      <Box sx={{ 
                        display: 'inline-flex', p: 2, borderRadius: '12px', mb: 3,
                        background: `color-mix(in srgb, ${feature.color} 15%, transparent)`,
                        color: feature.color,
                        boxShadow: `0 0 15px ${feature.color}40`
                      }}>
                        {React.cloneElement(feature.icon, { sx: { fontSize: 32 } })}
                      </Box>
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>{feature.title}</Typography>
                      <Typography variant="body1" sx={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.description}</Typography>
                    </Box>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* Action Demo Section */}
        <Fade in timeout={2000}>
          <Box mt={12} textAlign="center" className="glass-panel" sx={{ p: { xs: 4, md: 8 }, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'var(--neon-purple)', filter: 'blur(80px)', opacity: 0.3, zIndex: 0 }} />
            
            <Box position="relative" zIndex={1}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 3, color: 'white' }}>
                Ready to Transform Education?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'var(--text-secondary)', maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
                Join thousands of educators who are already using AI to improve student outcomes. Start with our comprehensive assessment.
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button variant="contained" size="large" onClick={() => navigate('/comprehensive-form')} sx={{
                    px: 4, py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: 2, textTransform: 'none',
                    background: 'linear-gradient(90deg, var(--neon-green) 0%, #00cc55 100%)', color: 'black',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}>
                  Try Demo Assessment
                </Button>
                
                <Button variant="outlined" size="large" onClick={() => navigate('/analytics')} sx={{
                    px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600, borderRadius: 2, textTransform: 'none',
                    borderColor: 'rgba(255,255,255,0.2)', color: 'white',
                    '&:hover': { background: 'rgba(255,255,255,0.1)', borderColor: 'var(--neon-blue)', transform: 'translateY(-2px)' }
                  }}>
                  View Analytics Demo
                </Button>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LandingPage;