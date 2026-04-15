import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { LocalFireDepartment, AutoAwesome, Timeline } from '@mui/icons-material';
import { motion } from 'framer-motion';

// API Services
import { studentAPI, tenthStandardAPI } from '../services/api';
import streakService from '../services/streakService';

// Modern Components
import StatWidget from '../components/dashboard/StatWidget';
import AIChatBot from '../components/dashboard/AIChatBot';
import GamificationSection from '../components/dashboard/GamificationSection';
import PerformanceCharts from '../components/dashboard/PerformanceCharts';
import EngagementWidget from '../components/dashboard/EngagementWidget';

const StudentDashboardModern = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [examScores, setExamScores] = useState([]);
  const [studyStreak, setStudyStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch core dashboard data
        const response = await studentAPI.getDashboard(studentId).catch(() => tenthStandardAPI.getDashboard(studentId));
        if (response && response.data) {
          setDashboardData(response.data);
          
          const savedData = response.data.dashboard_data || {};
          if (savedData.exam_scores) setExamScores(savedData.exam_scores);
          if (savedData.total_study_time) setTotalStudyTime(savedData.total_study_time);
          if (savedData.achievements) setAchievements(savedData.achievements);
          if (savedData.current_xp) setCurrentXP(savedData.current_xp);
          if (savedData.current_level) setCurrentLevel(savedData.current_level);
        }

        // Fetch Streak
        const streakData = await streakService.getStreak(studentId);
        setStudyStreak(streakData.streak_count || 0);

        // Fetch cached AI report if any
        const savedReport = localStorage.getItem(`aiReport_${studentId}`);
        if (savedReport) {
          setAiReport(savedReport);
        } else {
          // Auto generate if none existing
          handleGenerateAIReport();
        }

      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load your profile. Please check connection.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await studentAPI.getAdvisorReport(studentId);
      setAiReport(response.data.report);
      localStorage.setItem(`aiReport_${studentId}`, response.data.report);
    } catch (err) {
      console.error('Error generating AI report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-dark)' }}>
        <CircularProgress sx={{ color: 'var(--neon-blue)' }} />
      </Box>
    );
  }

  const studentInfo = dashboardData?.student_info || { name: 'Student' };
  const riskLevel = dashboardData?.recommendations?.dropout_risk?.toLowerCase() || 'low';
  const riskColor = riskLevel === 'high' ? 'var(--status-danger)' : riskLevel === 'medium' ? 'var(--status-warning)' : 'var(--status-good)';

  return (
    <Container maxWidth="xl" sx={{ py: 4, minHeight: '100vh' }}>
      {/* Header Profile Section */}
      <Box component={motion.div} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {studentInfo.name} 👋
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
            Your personalized learning hub is ready.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ px: 2, py: 1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${riskColor}40` }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Current Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: riskColor, mr: 1, boxShadow: `0 0 10px ${riskColor}` }} />
              <Typography variant="body2" sx={{ color: riskColor, fontWeight: 'bold', textTransform: 'capitalize' }}>
                {riskLevel} Risk Profile
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Main Grid Layout */}
      <Grid container spacing={3}>
        
        {/* Top Row: Mini Stats */}
        <Grid item xs={12} md={4} lg={3}>
          <StatWidget 
            title="Study Streak" 
            value={studyStreak} 
            subtitle="Days" 
            icon={<LocalFireDepartment fontSize="large" />} 
            color="var(--neon-orange)" 
          />
        </Grid>
        <Grid item xs={12} md={4} lg={3}>
          <StatWidget 
            title="Total Study Time" 
            value={Math.floor(totalStudyTime)} 
            subtitle="Hours" 
            icon={<Timeline fontSize="large" />} 
            color="var(--neon-green)" 
          />
        </Grid>
        <Grid item xs={12} md={4} lg={6}>
           <GamificationSection currentXP={currentXP} currentLevel={currentLevel} achievements={achievements} />
        </Grid>

        {/* Quick Actions Row */}
        <Grid item xs={12}>
          <Box sx={{ 
            p: 3, 
            borderRadius: 4, 
            backgroundColor: 'rgba(33, 150, 243, 0.1)', 
            border: '1px solid rgba(33, 150, 243, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(33, 150, 243, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}
          onClick={() => navigate(`/quiz-generator/${studentId}`)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                backgroundColor: 'var(--neon-blue)', 
                display: 'flex', 
                boxShadow: '0 0 15px rgba(33, 150, 243, 0.5)' 
              }}>
                <AutoAwesome sx={{ color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Quiz Generator</Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  Upload your notes and generate a personalized quiz in seconds.
                </Typography>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: 'var(--neon-blue)', 
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#1976d2' }
              }}
            >
              Start Generating
            </Button>
          </Box>
        </Grid>

        {/* Middle Row: AI & Engagement */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ height: '100%', minHeight: 450 }}>
            <AIChatBot 
              report={aiReport} 
              isGenerating={isGeneratingReport} 
              onRegenerate={handleGenerateAIReport} 
            />
          </Box>
        </Grid>
        <Grid item xs={12} lg={4} sx={{ alignItems: 'flex-start' }}>
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Daily Challenge & Timer */}
              <EngagementWidget subjects={dashboardData?.recommendations?.subject_focus_areas} />
           </Box>
        </Grid>

        {/* Bottom Row: Charts & Extra Data */}
        <Grid item xs={12}>
           <Box sx={{ mt: 1 }}>
              <PerformanceCharts data={examScores} />
           </Box>
        </Grid>

      </Grid>
    </Container>
  );
};

export default StudentDashboardModern;
