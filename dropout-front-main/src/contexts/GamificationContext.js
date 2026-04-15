import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { studentAPI, questAPI } from '../services/api';
import { Snackbar, Alert, Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Timer State
  const [activeQuest, setActiveQuest] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds

  // Fetch unified student data
  const refreshStudentData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('GamificationContext: Syncing student data...');
      const response = await studentAPI.getMyUnifiedData();
      if (response && response.data) {
        console.log('GamificationContext: Sync success!');
        setStudentData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('GamificationContext: Sync FAILED!', err);
      if (err.response) {
        console.error('Error Status:', err.response.status);
        console.error('Error Data:', err.response.data);
      }
      setError('Failed to load progress data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('active_quest_session');
    if (saved) {
      const session = JSON.parse(saved);
      const startTime = session.startTime;
      const durationMs = session.duration * 60 * 1000;
      const elapsedMs = Date.now() - startTime;
      const remainingMs = durationMs - elapsedMs;

      if (remainingMs > 0) {
        setActiveQuest(session);
        setTimeLeft(Math.floor(remainingMs / 1000));
      } else {
        localStorage.removeItem('active_quest_session');
      }
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (activeQuest && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-complete when timer hits zero
            stopQuestTimer(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuest, timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const startQuestTimer = async (questId, title, duration) => {
    try {
      // 1. Log start to backend
      const studentId = studentData?.student_id;
      if (studentId) {
        await questAPI.startSession(studentId, questId, duration);
      }

      // 2. Set local state
      const session = {
        id: questId,
        title,
        duration,
        startTime: Date.now()
      };
      setActiveQuest(session);
      setTimeLeft(duration * 60);
      localStorage.setItem('active_quest_session', JSON.stringify(session));
      
      showNotification([`Started Quest: ${title} ⏱`]);
    } catch (err) {
      console.error('Error starting quest timer:', err);
    }
  };

  const stopQuestTimer = async (isCompleted = true) => {
    if (!activeQuest) return;

    try {
      const studentId = studentData?.student_id;
      const elapsedMinutes = (Date.now() - activeQuest.startTime) / (1000 * 60);
      
      const response = await questAPI.endSession(
        studentId, 
        activeQuest.id, 
        elapsedMinutes, 
        isCompleted
      );

      if (response.data) {
        showNotification(response.data.feedback);
        await refreshStudentData();
      }

      // Cleanup
      setActiveQuest(null);
      setTimeLeft(0);
      localStorage.removeItem('active_quest_session');
    } catch (err) {
      console.error('Error stopping quest timer:', err);
    }
  };

  // Show a notification popup
  const showNotification = useCallback((messages) => {
    if (!messages || messages.length === 0) return;
    
    const newNotifications = messages.map(msg => ({
      id: Math.random().toString(36).substr(2, 9),
      message: msg
    }));

    setNotifications(prev => [...prev, ...newNotifications]);
  }, []);

  // Log study time
  const logStudyTime = async (hours) => {
    try {
      const response = await studentAPI.logStudy(hours);
      if (response.data.success) {
        showNotification(response.data.feedback);
        await refreshStudentData();
      }
      return response.data;
    } catch (err) {
      console.error('Error logging study time:', err);
      return { success: false, error: err.message };
    }
  };

  // Generic update progress
  const updateProgress = async (type, data) => {
    try {
      const response = await studentAPI.updateProgress({ type, data });
      if (response.data.success) {
        showNotification(response.data.feedback);
        await refreshStudentData();
      }
      return response.data;
    } catch (err) {
      console.error('Error updating progress:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    refreshStudentData();
  }, [refreshStudentData]);

  const handleCloseNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <GamificationContext.Provider value={{
      studentData,
      loading,
      error,
      refreshStudentData,
      logStudyTime,
      updateProgress,
      showNotification,
      activeQuest,
      timeLeft,
      startQuestTimer,
      stopQuestTimer
    }}>
      {children}
      
      {/* Real-time Notifications Overlay */}
      <Box sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              onAnimationComplete={() => {
                setTimeout(() => handleCloseNotification(n.id), 5000);
              }}
            >
              <Alert 
                severity="success" 
                variant="filled"
                onClose={() => handleCloseNotification(n.id)}
                sx={{ 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(135deg, #6200ea 0%, #03dac6 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  '& .MuiAlert-icon': { color: 'white' }
                }}
              >
                {n.message}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </GamificationContext.Provider>
  );
};
