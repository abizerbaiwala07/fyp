import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
// Removed Clerk imports
// import { useUser, useClerk } from '@clerk/clerk-react';
// Removed legacy AuthContext import
// import { useAuth } from '../contexts/AuthContext';
// Import Firebase Auth Context


const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  // Get user info from localStorage for display (fallback for legacy users)
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');
  const userPhoto = localStorage.getItem('userPhoto');
  const hasCompletedForm = localStorage.getItem('formCompleted') === 'true';
  const studentId = localStorage.getItem('demoStudentId');

  // Conditional menu items based on form completion
  const getMenuItems = () => {
    if (hasCompletedForm && studentId) {
      return [
        { label: 'Dashboard', path: `/student-dashboard/${studentId}`, icon: <DashboardIcon /> },
        { label: 'AI Quiz', path: `/quiz-generator/${studentId}`, icon: <AssignmentIcon /> },
      ];
    } else {
      return [
        { label: 'Student Form', path: '/comprehensive-form', icon: <AssignmentIcon /> },
        { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.label}
            onClick={() => handleMenuClick(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Use Firebase user info if available, otherwise fallback to localStorage
  const displayEmail = user?.email || userEmail;
  const displayName = user?.displayName || userName;
  const displayPhoto = user?.photoURL || userPhoto;

  return (
    <>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="logo"
            sx={{ mr: 2 }}
            onClick={() => navigate('/')}
          >
            <SchoolIcon />
          </IconButton>

          <Typography
            variant={isMobile ? 'subtitle1' : 'h6'}
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            {isMobile ? 'SDPS' : 'Student Dropout Prediction System'}
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    backgroundColor:
                      location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {/* Right side auth section: show user info + Logout if logged in, else Login */}
              {user || userEmail ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                  {displayPhoto && (
                    <Avatar 
                      src={displayPhoto} 
                      alt={displayName || displayEmail}
                      sx={{ width: 32, height: 32 }}
                    />
                  )}
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {displayName || displayEmail}
                  </Typography>
                  <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                  >
                    Logout
                  </Button>
                </Box>
              ) : (
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

       <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;