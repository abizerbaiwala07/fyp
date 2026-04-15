import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  School,
  TrendingUp,
  EmojiEvents,
  LocalFireDepartment,
  Psychology,
  Speed,
  ExpandMore,
  Assignment,
  Star,
  Book
} from '@mui/icons-material';
import { tenthStandardAPI, studentAPI } from '../services/api';
import streakService from '../services/streakService';

const StudentDashboard = () => {
  const { studentId } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examScoreDialog, setExamScoreDialog] = useState(false);
  const [examScore, setExamScore] = useState('');
  const [examScores, setExamScores] = useState([]);
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);
  const [canUpdateStreak, setCanUpdateStreak] = useState(true);
  const [nextUpdateMessage, setNextUpdateMessage] = useState('Click daily to maintain streak');
  const [achievements, setAchievements] = useState([]);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  // New state for challenge section
  const [challenges, setChallenges] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState({});
  const [studySchedule, setStudySchedule] = useState({});
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const loadFromLocalStorage = () => {
    // Load exam scores from localStorage
    const savedScores = localStorage.getItem(`examScores_${studentId}`);
    if (savedScores) {
      setExamScores(JSON.parse(savedScores));
    }

    // Initialize achievements
    const savedAchievements = localStorage.getItem(`achievements_${studentId}`);
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      // Set initial achievements
      const initialAchievements = [
        { id: 1, title: 'Welcome Aboard!', description: 'Started your academic journey', icon: '🎉', unlocked: true, date: new Date().toLocaleDateString() },
        { id: 2, title: 'First Steps', description: 'Completed your profile', icon: '👣', unlocked: true, date: new Date().toLocaleDateString() }
      ];
      setAchievements(initialAchievements);
      localStorage.setItem(`achievements_${studentId}`, JSON.stringify(initialAchievements));
    }

    // Load total study time
    const savedStudyTime = localStorage.getItem(`totalStudyTime_${studentId}`) || 0;
    setTotalStudyTime(parseInt(savedStudyTime));
  };

  const createFallbackData = () => {
    // Get user data from localStorage
    const userName = localStorage.getItem('userName') || 'Student';
    
    // Create realistic fallback data based on user
    return {
      student_info: {
        name: userName,
        student_id: studentId,
        age: 17,
        current_class: '12th',
        current_stream: 'Science',
        tenth_percentage: 85.5,
        current_attendance: 92,
        target_exam: 'JEE Main',
        exam_start_month: 'January',
        exam_end_month: 'April',
        preparation_months: 18
      },
      recommendations: {
        dropout_risk: 'Low',
        risk_percentage: 15,
        primary_risk_factors: [
          'Time management could be improved',
          'Focus on weak subjects needed'
        ],
        protective_factors: [
          'Strong academic foundation',
          'Good attendance record',
          'Clear career goals',
          'Family support available'
        ],
        academic_improvements: [
          'Increase daily study hours to 6-7 hours',
          'Practice more mock tests',
          'Focus on conceptual understanding',
          'Regular revision schedule'
        ],
        subject_focus_areas: [
          'Mathematics - Calculus and Algebra',
          'Physics - Mechanics and Thermodynamics',
          'Chemistry - Organic Chemistry'
        ],
        immediate_actions: [
          'Complete pending assignments',
          'Take a practice test this week',
          'Review last month\'s topics'
        ],
        short_term_goals: [
          'Improve mock test scores by 10%',
          'Complete syllabus by December',
          'Join study group or coaching'
        ],
        long_term_goals: [
          'Score 95+ percentile in JEE Main',
          'Get admission in top engineering college',
          'Build strong foundation for career'
        ]
      }
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try the new student dashboard API first
      try {
        const response = await studentAPI.getDashboard(studentId);
        setDashboardData(response.data);
        return;
      } catch (newApiError) {
        console.warn('New API failed, trying fallback:', newApiError);
      }
      
      // Fallback to old API
      try {
        const response = await tenthStandardAPI.getDashboard(studentId);
        setDashboardData(response.data);
        return;
      } catch (oldApiError) {
        console.warn('Old API also failed:', oldApiError);
      }
      
      // If both APIs fail, use fallback data
      console.log('Using fallback data due to network error');
      const fallbackData = createFallbackData();
      setDashboardData(fallbackData);
      
      // Show a subtle notification that we're using offline data
      setError('Using offline data - some features may be limited');
      
    } catch (err) {
      console.error('Dashboard loading error:', err);
      const fallbackData = createFallbackData();
      setDashboardData(fallbackData);
      setError('Using offline data - some features may be limited');
    } finally {
      setLoading(false);
    }
  };

  const initializeUserData = async () => {
    try {
      // Try to load data from database first
      const dashboardResponse = await studentAPI.getDashboard(studentId);
      const savedData = dashboardResponse.data.dashboard_data;
      
      if (savedData) {
        // Load from database
        if (savedData.exam_scores) setExamScores(savedData.exam_scores);
        if (savedData.study_streak) setStudyStreak(savedData.study_streak);
        if (savedData.achievements) setAchievements(savedData.achievements);
        if (savedData.total_study_time) setTotalStudyTime(savedData.total_study_time);
        // Load challenge data
        if (savedData.challenges) setChallenges(savedData.challenges);
        if (savedData.subjects) setSubjects(savedData.subjects);
        if (savedData.selected_subjects) setSelectedSubjects(savedData.selected_subjects);
        if (savedData.difficulty_levels) setDifficultyLevels(savedData.difficulty_levels);
        if (savedData.study_schedule) setStudySchedule(savedData.study_schedule);
      } else {
        // Fallback to localStorage
        loadFromLocalStorage();
      }
    } catch (error) {
      console.warn('Failed to load dashboard data from database, using localStorage:', error);
      loadFromLocalStorage();
    }

    // Set motivational quote
    const quotes = [
      "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
      "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
      "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
      "The only way to do great work is to love what you do. - Steve Jobs",
      "Believe you can and you're halfway there. - Theodore Roosevelt",
      "Your limitation—it's only your imagination.",
      "Push yourself, because no one else is going to do it for you.",
      "Great things never come from comfort zones.",
      "Dream it. Wish it. Do it.",
      "Success doesn't just find you. You have to go out and get it."
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMotivationalQuote(randomQuote);
  };

  // Function to save dashboard data to database
  const saveDashboardData = async () => {
    try {
      const dashboardData = {
        exam_scores: examScores,
        study_streak: studyStreak,
        achievements: achievements,
        total_study_time: totalStudyTime,
        progress_data: {
          latest_score: examScores.length > 0 ? examScores[examScores.length - 1].score : 0,
          progress_percentage: calculateProgress()
        },
        // Save challenge data
        challenges: challenges,
        subjects: subjects,
        selected_subjects: selectedSubjects,
        difficulty_levels: difficultyLevels,
        study_schedule: studySchedule
      };

      await studentAPI.saveDashboardData(studentId, dashboardData);
      console.log('Dashboard data saved successfully');
    } catch (error) {
      console.warn('Failed to save dashboard data to database:', error);
      // Continue with localStorage as fallback
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchDashboardData();
        await initializeUserData();
        await checkStreakStatus();
        setDataInitialized(true);
      } catch (err) {
        console.error('Initial data load failed:', err);
        // Even if some fails, we allow initialization after attempting all
        setDataInitialized(true);
      }
    };
    loadData();
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkStreakStatus = async () => {
    try {
      // Get current streak status from streak service
      const streakData = await streakService.getStreak(studentId);
      
      setStudyStreak(streakData.streak_count || 0);
      setCanUpdateStreak(streakData.can_update !== false);
      
      // Get formatted time until next update
      const timeMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
      setNextUpdateMessage(timeMessage || 'Click daily to maintain streak');
    } catch (err) {
      console.error('Error checking streak status:', err);
      // Fallback to default values
      setStudyStreak(0);
      setCanUpdateStreak(true);
      setNextUpdateMessage('Click daily to maintain streak');
    }
  };

  // Auto-save dashboard data when key data changes
  useEffect(() => {
    const saveData = async () => {
      // ONLY save if data has been fully initialized from the server
      // to avoid overwriting real data with initial state values
      if (dataInitialized && (examScores.length > 0 || studyStreak > 0 || achievements.length > 0)) {
        await saveDashboardData();
      }
    };
    saveData();
  }, [examScores, studyStreak, achievements, totalStudyTime, dataInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStreakClick = async () => {
    try {
      const now = new Date();
      
      // Update streak through streak service
      const response = await streakService.updateStreak(studentId, now);
      
      if (response.success) {
        // Update local state with the new streak count
        setStudyStreak(response.streak_count || 0);
        setCanUpdateStreak(false);
        
        // Get updated time message
        const timeMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
        setNextUpdateMessage(timeMessage || 'Available in 24 hours');
        
        // Show success message
        console.log(response.message || 'Streak updated successfully!');
      } else {
        // Streak update not allowed
        console.log(response.message || 'Streak can only be updated once every 24 hours');
        alert(response.message || 'Streak can only be updated once every 24 hours');
        
        // Update the UI with the current streak data
        setStudyStreak(response.streak_count || 0);
        setCanUpdateStreak(false);
        
        // Get updated time message
        const timeMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
        setNextUpdateMessage(timeMessage || 'Available in 24 hours');
      }
    } catch (err) {
      console.error('Error updating streak:', err);
      // Show error message to user
      alert('Error updating streak. Please try again.');
      
      // Try to get current streak data as fallback
      try {
        const streakData = await streakService.getStreak(studentId);
        setStudyStreak(streakData.streak_count || 0);
        setCanUpdateStreak(streakData.can_update !== false);
        
        const timeMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
        setNextUpdateMessage(timeMessage || 'Click daily to maintain streak');
      } catch (fallbackErr) {
        console.error('Error getting fallback streak data:', fallbackErr);
      }
    }
  };

  // Challenge section functions
  const handleAcceptChallenge = () => {
    setShowChallengeDialog(true);
  };

  const handleChallengeSubmit = () => {
    setShowChallengeDialog(false);
    setShowDifficultyDialog(true);
  };

  const handleAddSubject = (subjectName) => {
    if (subjectName.trim() && !subjects.includes(subjectName.trim())) {
      setSubjects(prev => [...prev, subjectName.trim()]);
      setSelectedSubjects(prev => [...prev, subjectName.trim()]);
    }
  };

  const handleDifficultySubmit = () => {
    // Generate schedule with all subjects but prioritize hard ones
    generateStudySchedule(subjects);
    setShowDifficultyDialog(false);
  };

  const handleDifficultyChange = (subject, level) => {
    setDifficultyLevels(prev => ({
      ...prev,
      [subject]: level
    }));
  };

  const generateStudySchedule = (allSubjects) => {
    const schedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Separate hard and non-hard subjects
    const hardSubjects = allSubjects.filter(subject => 
      difficultyLevels[subject] === 'hard'
    );
    
    const otherSubjects = allSubjects.filter(subject => 
      difficultyLevels[subject] !== 'hard'
    );
    
    // Create combined list with hard subjects first
    const prioritizedSubjects = [...hardSubjects, ...otherSubjects];
    
    // Assign subjects to days, prioritizing hard subjects
    prioritizedSubjects.forEach((subject, index) => {
      // Distribute subjects across days
      const dayIndex = index % days.length;
      const day = days[dayIndex];
      
      if (!schedule[day]) {
        schedule[day] = [];
      }
      
      // Add subject with difficulty info
      schedule[day].push({
        name: subject,
        difficulty: difficultyLevels[subject] || 'medium'
      });
    });
    
    setStudySchedule(schedule);
    
    // Add achievement for accepting challenge
    if (allSubjects.length > 0) {
      const newAchievement = {
        id: Date.now(),
        title: 'Study Plan Created!',
        description: 'Generated personalized study schedule',
        icon: '📅',
        unlocked: true,
        date: new Date().toLocaleDateString()
      };
      
      setAchievements(prev => [...prev, newAchievement]);
    }
  };

  const handleExamScoreSubmit = async () => {
    if (!examScore || examScore < 0 || examScore > 100) {
      alert('Please enter a valid score between 0-100');
      return;
    }

    setScoreSubmitting(true);
    try {
      // Create new score entry
      const newScore = {
        id: Date.now(),
        score: parseFloat(examScore),
        date: new Date().toLocaleDateString(),
        exam: dashboardData?.student_info?.target_exam || 'Target Exam'
      };
      
      const updatedScores = [...examScores, newScore];
      setExamScores(updatedScores);
      
      // Save to localStorage as backup
      localStorage.setItem(`examScores_${studentId}`, JSON.stringify(updatedScores));
      
      setExamScore('');
      setExamScoreDialog(false);
      
      // Show success message
      alert('Exam score added successfully!');
      
      // The useEffect will automatically save to database
      
    } catch (err) {
      console.error('Error adding exam score:', err);
      alert('Error adding exam score. Please try again.');
    } finally {
      setScoreSubmitting(false);
    }
  };

  const handleGenerateAIReport = async () => {
    if (!studentId) return;
    
    setIsGeneratingReport(true);
    try {
      const response = await studentAPI.getAdvisorReport(studentId);
      setAiReport(response.data.report);
      // Save it locally so it persists during the session
      localStorage.setItem(`aiReport_${studentId}`, response.data.report);
    } catch (err) {
      console.error('Error generating AI report:', err);
      setError('Failed to generate AI report. Please check your network or API settings.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Load existing AI report from localStorage on mount
  useEffect(() => {
    const savedReport = localStorage.getItem(`aiReport_${studentId}`);
    if (savedReport) setAiReport(savedReport);
  }, [studentId]);

  const calculateProgress = () => {
    if (examScores.length === 0) return 0;
    const latestScore = examScores[examScores.length - 1].score;
    return Math.min(latestScore, 100);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">No dashboard data available</Alert>
      </Container>
    );
  }

  const { student_info, recommendations } = dashboardData;

  // Safety checks to ensure data is properly formatted
  const safeRecommendations = {
    dropout_risk: recommendations?.dropout_risk || 'Unknown',
    risk_percentage: typeof recommendations?.risk_percentage === 'number' ? recommendations.risk_percentage : 0,
    primary_risk_factors: Array.isArray(recommendations?.primary_risk_factors) ? recommendations.primary_risk_factors : [],
    protective_factors: Array.isArray(recommendations?.protective_factors) ? recommendations.protective_factors : [],
    academic_improvements: Array.isArray(recommendations?.academic_improvements) ? recommendations.academic_improvements : [],
    subject_focus_areas: Array.isArray(recommendations?.subject_focus_areas) ? recommendations.subject_focus_areas : [],
    immediate_actions: Array.isArray(recommendations?.immediate_actions) ? recommendations.immediate_actions : [],
    short_term_goals: Array.isArray(recommendations?.short_term_goals) ? recommendations.short_term_goals : [],
    long_term_goals: Array.isArray(recommendations?.long_term_goals) ? recommendations.long_term_goals : []
  };

  const safeStudentInfo = {
    name: student_info?.name || localStorage.getItem('userName') || 'Student',
    student_id: student_info?.student_id || studentId,
    age: student_info?.age || 17,
    current_class: student_info?.current_class || '12th',
    current_stream: student_info?.current_stream || 'Science',
    degree_type: student_info?.degree_type || null,
    degree_year: student_info?.degree_year || null,
    current_cgpa: student_info?.current_cgpa || null,
    tenth_percentage: student_info?.tenth_percentage || 85.5,
    current_attendance: student_info?.current_attendance || 92
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 3 } }}>
      {/* Header Section */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="h1" gutterBottom>
              Welcome, {safeStudentInfo.name}! 👋
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Student ID: {safeStudentInfo.student_id}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {safeStudentInfo.degree_type ? (
                <Typography variant="body1" color="text.secondary">
                  📚 {safeStudentInfo.degree_type} - Year {safeStudentInfo.degree_year} | CGPA: {safeStudentInfo.current_cgpa}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  📚 {safeStudentInfo.current_class} - {safeStudentInfo.current_stream} Stream
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                🎯 10th Percentage: {safeStudentInfo.tenth_percentage}% | 📊 Current Attendance: {safeStudentInfo.current_attendance}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" justifyContent="flex-end">
              <CheckCircle color="success" />
              <Box ml={1}>
                <Typography variant="h6">
                  Academic Status: 
                  <Chip 
                    label={safeRecommendations.dropout_risk === 'Low' ? 'Excellent' : safeRecommendations.dropout_risk === 'Medium' ? 'Good' : 'Needs Attention'} 
                    color={getRiskColor(safeRecommendations.dropout_risk)}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate: {(100 - safeRecommendations.risk_percentage).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Show offline notification if using fallback data */}
      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Motivational Quote Section */}
      <Paper elevation={3} sx={{ 
        p: 3, 
        mb: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        textAlign: 'center'
      }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Psychology sx={{ mr: 1 }} />
          Daily Motivation
        </Typography>
        <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
          "{motivationalQuote}"
        </Typography>
      </Paper>

      {/* Study Streak & Achievements Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', 
            color: 'white',
            height: '100%'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocalFireDepartment sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {studyStreak}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Day Study Streak
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Keep it up! Consistency is key to success
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleStreakClick}
                disabled={!canUpdateStreak}
                sx={{
                  mt: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                Mark Today as Studied
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.8 }}>
                {nextUpdateMessage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEvents sx={{ mr: 1, color: 'gold' }} />
                Recent Achievements
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {achievements.filter(a => a.unlocked).slice(-3).map((achievement) => (
                  <Box key={achievement.id} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2, 
                    p: 1, 
                    borderRadius: 1, 
                    backgroundColor: 'rgba(255, 193, 7, 0.1)' 
                  }}>
                    <Typography sx={{ fontSize: '2rem', mr: 2 }}>
                      {achievement.icon}
                    </Typography>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description} • {achievement.date}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Total Achievements: {achievements.filter(a => a.unlocked).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Challenge Section - Updated to show all subjects */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{ 
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            color: 'white',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 1 }} />
            <Typography variant="h6">Personalized Study Challenge</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '0 0 8px 8px' }}>
            {subjects.length === 0 ? (
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  Ready to create your study plan?
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Identify your subjects and create a personalized study schedule
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAcceptChallenge}
                  startIcon={<Star />}
                  sx={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #43A047 0%, #388E3C 100%)'
                    }
                  }}
                >
                  Create Study Plan
                </Button>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Book sx={{ mr: 1 }} />
                    Your Study Schedule
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setShowChallengeDialog(true)}
                  >
                    Edit Subjects
                  </Button>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Your Subjects:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {subjects.map((subject, index) => (
                      <Chip
                        key={index}
                        label={subject}
                        color={difficultyLevels[subject] === 'hard' ? "error" : "primary"}
                        variant={difficultyLevels[subject] === 'hard' ? "filled" : "outlined"}
                      />
                    ))}
                  </Box>
                  <Button 
                    startIcon={<Star />} 
                    onClick={() => setShowDifficultyDialog(true)}
                    size="small"
                  >
                    Update Difficulty Levels
                  </Button>
                </Box>
                
                {Object.keys(studySchedule).length > 0 ? (
                  <Grid container spacing={2}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2, width: '100%' }}>
                      Weekly Schedule (Hard subjects prioritized)
                    </Typography>
                    {Object.entries(studySchedule).map(([day, subjects]) => (
                      <Grid item xs={12} sm={6} md={4} key={day}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              {day}
                            </Typography>
                            <List dense>
                              {subjects.map((subjectObj, index) => (
                                <ListItem key={index} sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <Book 
                                      fontSize="small" 
                                      color={subjectObj.difficulty === 'hard' ? "error" : "primary"} 
                                    />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={subjectObj.name} 
                                    secondary={subjectObj.difficulty === 'hard' ? "Difficult" : ""}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box textAlign="center">
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Schedule not generated yet.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={() => generateStudySchedule(subjects)}
                    >
                      Generate Schedule
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* Quick Stats Dashboard */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Speed sx={{ mr: 1 }} />
          Quick Stats
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, backgroundColor: 'success.light', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {safeStudentInfo.tenth_percentage}%
              </Typography>
              <Typography variant="body2">
                10th Grade
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, backgroundColor: 'info.light', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {safeStudentInfo.current_attendance}%
              </Typography>
              <Typography variant="body2">
                Attendance
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, backgroundColor: 'warning.light', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {examScores.length}
              </Typography>
              <Typography variant="body2">
                Mock Tests
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box textAlign="center" sx={{ p: 2, borderRadius: 2, backgroundColor: 'secondary.light', color: 'white' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {(100 - safeRecommendations.risk_percentage).toFixed(0)}%
              </Typography>
              <Typography variant="body2">
                Success Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Exam Progress Section */}
      <Paper elevation={3} sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3, 
        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', 
        color: 'white' 
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant={{ xs: 'h6', sm: 'h5' }} gutterBottom sx={{ color: 'white' }}>
              🎯 Exam Progress Tracker
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255,255,255,0.9)' }}>
              Target Exam: {dashboardData?.student_info?.target_exam || 'Not specified'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Track your exam scores and monitor your progress towards your goal
            </Typography>
            
            {examScores.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.9)' }}>
                  Latest Score: {examScores[examScores.length - 1].score}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={calculateProgress()} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: calculateProgress() >= 80 ? '#fff' : calculateProgress() >= 60 ? '#ffeb3b' : '#f44336'
                    }
                  }} 
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Progress: {calculateProgress()}%
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setExamScoreDialog(true)}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                px: 4,
                py: 1.5,
                fontSize: '1rem'
              }}
            >
              Add Exam Score
            </Button>
            
            {examScores.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.8)' }}>
                Total Attempts: {examScores.length}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Degree Information Card (if applicable) */}
      {safeStudentInfo.degree_type && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
            🎓 Your Degree Progress
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {safeStudentInfo.current_cgpa}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Current CGPA
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                  {safeStudentInfo.degree_year}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Current Year
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                  {safeStudentInfo.degree_type}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  {safeStudentInfo.current_cgpa >= 8.5 ? '🌟 Excellent Performance!' : 
                   safeStudentInfo.current_cgpa >= 7.0 ? '👍 Good Progress!' : 
                   safeStudentInfo.current_cgpa >= 6.0 ? '📈 Room for Improvement' : 
                   '⚠️ Needs Immediate Attention'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                  {4 - safeStudentInfo.degree_year} year(s) remaining to graduation
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Academic Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="warning.main">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                Areas for Improvement
              </Typography>
              <List dense>
                {safeRecommendations.primary_risk_factors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={typeof factor === 'string' ? factor : 'Area for improvement'} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                Your Strengths
              </Typography>
              <List dense>
                {safeRecommendations.protective_factors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={typeof factor === 'string' ? factor : 'Your strength'} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Academic Recommendations */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📚 Your Personalized Study Plan
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              🎯 Focus Areas
            </Typography>
            <List>
              {safeRecommendations.academic_improvements.map((improvement, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <TrendingUp color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={typeof improvement === 'string' ? improvement : 'Academic improvement'} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              📖 Priority Subjects
            </Typography>
            <List>
              {safeRecommendations.subject_focus_areas.map((area, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <School color="secondary" />
                  </ListItemIcon>
                  <ListItemText primary={typeof area === 'string' ? area : 'Subject focus area'} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Plans */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          🚀 Your Action Plan
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="error">
              ⚡ This Week
            </Typography>
            <List>
              {safeRecommendations.immediate_actions.map((action, index) => (
                <ListItem key={index}>
                  <ListItemText primary={typeof action === 'string' ? action : 'Immediate action'} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="warning.main">
              📅 Next 3 Months
            </Typography>
            <List>
              {safeRecommendations.short_term_goals.map((goal, index) => (
                <ListItem key={index}>
                  <ListItemText primary={typeof goal === 'string' ? goal : 'Short-term goal'} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="success.main">
              🎯 Long-term Vision
            </Typography>
            <List>
              {safeRecommendations.long_term_goals.map((goal, index) => (
                <ListItem key={index}>
                  <ListItemText primary={typeof goal === 'string' ? goal : 'Long-term goal'} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Subject Selection Dialog - Updated */}
      <Dialog open={showChallengeDialog} onClose={() => setShowChallengeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Your Subjects</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tell us all the subjects you're studying.
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              fullWidth
              label="Add Subject"
              variant="outlined"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  handleAddSubject(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <Button 
              onClick={(e) => {
                const input = e.target.previousElementSibling.querySelector('input');
                if (input && input.value.trim()) {
                  handleAddSubject(input.value);
                  input.value = '';
                }
              }}
              variant="contained"
              sx={{ ml: 1, whiteSpace: 'nowrap' }}
            >
              Add
            </Button>
          </Box>
          
          {subjects.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Your Subjects:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {subjects.map((subject, index) => (
                  <Chip
                    key={index}
                    label={subject}
                    onDelete={() => {
                      setSubjects(prev => prev.filter(s => s !== subject));
                      setSelectedSubjects(prev => prev.filter(s => s !== subject));
                    }}
                    color={selectedSubjects.includes(subject) ? "primary" : "default"}
                  />
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChallengeDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleChallengeSubmit} 
            variant="contained"
            disabled={subjects.length === 0}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Difficulty Selection Dialog - New */}
      <Dialog open={showDifficultyDialog} onClose={() => setShowDifficultyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select Difficult Subjects</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Which subjects do you find most challenging?
          </Typography>
          
          <FormGroup>
            {subjects.map((subject) => (
              <FormControlLabel
                key={subject}
                control={
                  <Checkbox 
                    checked={difficultyLevels[subject] === 'hard'} 
                    onChange={(e) => handleDifficultyChange(subject, e.target.checked ? 'hard' : 'medium')} 
                  />
                }
                label={subject}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDifficultyDialog(false)}>Back</Button>
          <Button 
            onClick={handleDifficultySubmit} 
            variant="contained"
          >
            Generate Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exam Score Dialog */}
      <Dialog open={examScoreDialog} onClose={() => setExamScoreDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Exam Score</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your latest exam score to track your progress
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Exam Score (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={examScore}
            onChange={(e) => setExamScore(e.target.value)}
            inputProps={{ min: 0, max: 100, step: 0.1 }}
            helperText="Enter score between 0-100"
          />
          
          {examScores.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Previous Scores:</Typography>
              <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                {examScores.slice(-5).reverse().map((score, index) => (
                  <Chip
                    key={score.id}
                    label={`${score.score}% (${score.date})`}
                    size="small"
                    color={score.score >= 80 ? 'success' : score.score >= 60 ? 'warning' : 'error'}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExamScoreDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleExamScoreSubmit} 
            variant="contained"
            disabled={scoreSubmitting || !examScore}
          >
            {scoreSubmitting ? <CircularProgress size={20} /> : 'Add Score'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Academic Advisor Section */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, mb: 4, borderRadius: 2, background: 'rgba(33, 150, 243, 0.05)', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ mr: 2, color: 'primary.main', fontSize: { xs: 30, sm: 40 } }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">AI Academic Advisor</Typography>
              <Typography variant="body2" color="text.secondary">Personalized analysis powered by Gemini AI</Typography>
            </Box>
          </Box>
          <Button 
            variant="contained" 
            startIcon={isGeneratingReport ? <CircularProgress size={20} color="inherit" /> : <Star />}
            onClick={handleGenerateAIReport}
            disabled={isGeneratingReport}
            sx={{ borderRadius: 8, px: 3, alignSelf: { xs: 'flex-end', sm: 'auto' } }}
          >
            {aiReport ? 'Refresh Strategy' : 'Generate Analysis'}
          </Button>
        </Box>

        {aiReport ? (
          <Box sx={{ 
            '& h1, & h2, & h3': { color: 'primary.main', mb: 2, mt: 3 },
            '& p': { mb: 2, lineHeight: 1.6 },
            '& li': { mb: 1 },
            '& ul': { mb: 2 },
            '& blockquote': { 
              borderLeft: '4px solid', 
              borderColor: 'primary.main', 
              pl: 2, 
              fontStyle: 'italic', 
              color: 'text.secondary',
              my: 2 
            }
          }}>
            <ReactMarkdown>{aiReport}</ReactMarkdown>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}>
            <Typography variant="body1" gutterBottom>
              Get a highly personalized study plan and performance analysis based on your recent activity.
            </Typography>
            <Typography variant="caption">
              Our AI analyzes your scores, attendance, and study habits to provide practical action items.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default StudentDashboard;
