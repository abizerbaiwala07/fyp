import React, { createContext, useContext, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { onAuthStateChanged, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { studentAPI, authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Enhanced logout function
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all user data
      localStorage.clear();
      setCurrentUser(null);
      setProfileCompleted(false);
      setUserProfile(null);
      setDashboardData(null);
    }
  };

  // Check if user has completed their profile
  const checkProfileCompletion = async (user, directData = null) => {
    try {
      // Use direct data if provided (e.g., from login response)
      if (directData) {
        if (directData.form_completed && directData.student_id) {
          setProfileCompleted(true);
          setUserProfile({
            formCompleted: true,
            studentId: directData.student_id,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL
          });
          localStorage.setItem('formCompleted', 'true');
          localStorage.setItem('demoStudentId', directData.student_id);
          return true;
        } else {
          setProfileCompleted(false);
          return false;
        }
      }

      // Check localStorage first for quick response
      const hasCompletedForm = localStorage.getItem('formCompleted') === 'true';
      const studentId = localStorage.getItem('demoStudentId');
      
      if (hasCompletedForm && studentId) {
        setProfileCompleted(true);
        if (!userProfile) {
          setUserProfile({
            formCompleted: true,
            studentId: studentId,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL
          });
        }
        return true;
      }

      // Check with backend if available
      try {
        const response = await authAPI.getDashboard();
        if (response.data?.form_completed && response.data?.student_id) {
          setProfileCompleted(true);
          const sId = response.data.student_id;
          setUserProfile({
            formCompleted: true,
            studentId: sId,
            email: user.email,
            displayName: user.displayName || user.email,
            photoURL: user.photoURL
          });
          // Update localStorage
          localStorage.setItem('formCompleted', 'true');
          localStorage.setItem('demoStudentId', sId);
          return true;
        } else {
          setProfileCompleted(false);
          return false;
        }
      } catch (apiError) {
        console.warn('Backend profile check failed');
        setProfileCompleted(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileCompleted(false);
      return false;
    }
  };

  // Update user profile information
  const updateUserProfile = async (profileData) => {
    try {
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });
        
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          ...profileData
        }));
        
        // Update localStorage
        if (profileData.displayName) {
          localStorage.setItem('userName', profileData.displayName);
        }
        if (profileData.photoURL) {
          localStorage.setItem('userPhoto', profileData.photoURL);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Mark profile as completed
  const markProfileCompleted = (studentId) => {
    setProfileCompleted(true);
    setUserProfile(prev => ({
      ...prev,
      formCompleted: true,
      studentId: studentId
    }));
    localStorage.setItem('formCompleted', 'true');
    localStorage.setItem('demoStudentId', studentId);
  };

  // Load dashboard data
  const loadDashboardData = async (studentId) => {
    try {
      const response = await studentAPI.getDashboard(studentId);
      setDashboardData(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      return null;
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await user.getIdToken();
          
          // Store user information
          localStorage.setItem('userEmail', user.email || '');
          localStorage.setItem('userName', user.displayName || user.email || '');
          localStorage.setItem('userPhoto', user.photoURL || '');
          localStorage.setItem('jwt_token', token);
          
          setCurrentUser(user);
          
          // Check profile completion status
          await checkProfileCompletion(user);
        } else {
          // User is logged out
          localStorage.removeItem('jwt_token');
          setCurrentUser(null);
          setProfileCompleted(false);
          setUserProfile(null);
          setDashboardData(null);
        }
      } catch (error) {
        console.error('Error in onAuthStateChanged:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = { 
    user: currentUser, 
    currentUser, // Standardize keys
    logout, 
    loading,
    profileCompleted,
    userProfile,
    dashboardData,
    updateUserProfile,
    markProfileCompleted,
    loadDashboardData,
    checkProfileCompletion
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            bgcolor: '#121212'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};