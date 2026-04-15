import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  School,
  TrendingUp,
  Family,
  Psychology,
  Timeline,
  ExpandMore,
  Assignment,
  BookmarkBorder,
  Lightbulb,
  Info,
  LocalFireDepartment
} from '@mui/icons-material';
import { tenthStandardAPI } from '../services/api';
import streakService from '../services/streakService';

const StudentDashboard = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [formCompleted, setFormCompleted] = useState(true);
  const [streakCount, setStreakCount] = useState(0);
  const [canUpdateStreak, setCanUpdateStreak] = useState(true);
  const [nextUpdateMessage, setNextUpdateMessage] = useState('Click daily to maintain streak');

  useEffect(() => {
    // Check if form was completed
    const completed = localStorage.getItem('formCompleted') === 'true';
    setFormCompleted(completed);
    
    if (completed) {
      fetchDashboardData();
      checkStreakStatus();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await tenthStandardAPI.getDashboard(studentId);
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkStreakStatus = async () => {
    try {
      // Get current streak status from streak service
      const streakData = await streakService.getStreak(studentId);
      
      setStreakCount(streakData.streak_count);
      setCanUpdateStreak(streakData.can_update);
      
      // Get formatted time until next update
      const timeMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
      setNextUpdateMessage(timeMessage);
    } catch (err) {
      console.error('Error checking streak status:', err);
      // Fallback to default values
      setStreakCount(0);
      setCanUpdateStreak(true);
      setNextUpdateMessage('Click daily to maintain streak');
    }
  };

  const handleStreakClick = async () => {
    try {
      const now = new Date();
      
      // Update streak through streak service
      const response = await streakService.updateStreak(studentId, now);
      
      if (response.success) {
        // Update local state with the new streak count
        setStreakCount(response.streak_count);
        setCanUpdateStreak(false);
        
        // Get updated time message
        const timeMessage = await streakService.getFormattedTimeUntilNextUpdate(studentId);
        setNextUpdateMessage(timeMessage);
        
        // Show success message
        console.log(response.message || 'Streak updated successfully!');
      } else {
        // Streak update not allowed
        console.log(response.message);
        alert(response.message);
      }
    } catch (err) {
      console.error('Error updating streak:', err);
      // Show error message to user
      alert('Error updating streak. Please try again.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'info';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return <CheckCircle color="success" />;
      case 'medium': return <Warning color="warning" />;
      case 'high': return <Warning color="error" />;
      default: return <Warning color="info" />;
    }
  };

  const getSubjectRecommendations = (subject, subjectDetails) => {
    const recommendations = [];
    
    // Interest-based recommendations
    if (subjectDetails.interest_level <= 3) {
      recommendations.push('Explore real-world applications of this subject to increase interest');
      recommendations.push('Connect with peers who excel in this subject for study groups');
    } else if (subjectDetails.interest_level <= 6) {
      recommendations.push('Try different learning methods (videos, interactive content)');
      recommendations.push('Set small, achievable goals to build confidence');
    } else {
      recommendations.push('Leverage your interest to become a peer tutor');
      recommendations.push('Explore advanced topics and research opportunities');
    }
    
    // Difficulty-based recommendations
    if (subjectDetails.difficulty_level >= 8) {
      recommendations.push('Seek additional tutoring or academic support');
      recommendations.push('Break down complex topics into smaller, manageable parts');
      recommendations.push('Practice foundational concepts regularly');
    } else if (subjectDetails.difficulty_level >= 5) {
      recommendations.push('Review class notes daily and ask questions');
      recommendations.push('Use supplementary learning resources');
    } else {
      recommendations.push('Maintain consistent study habits to sustain performance');
      recommendations.push('Challenge yourself with advanced problems');
    }
    
    // Challenge-specific recommendations
    if (subjectDetails.challenges) {
      if (subjectDetails.challenges.toLowerCase().includes('math')) {
        recommendations.push('Practice math problems daily with step-by-step solutions');
        recommendations.push('Use visual aids and diagrams to understand concepts');
      } else if (subjectDetails.challenges.toLowerCase().includes('concept')) {
        recommendations.push('Create concept maps to visualize relationships');
        recommendations.push('Discuss difficult concepts with teachers during office hours');
      } else if (subjectDetails.challenges.toLowerCase().includes('memor')) {
        recommendations.push('Use memory techniques like mnemonics and flashcards');
        recommendations.push('Practice spaced repetition for better retention');
      }
    }
    
    // General recommendations
    recommendations.push('Set aside dedicated study time for this subject daily');
    recommendations.push('Track your progress with regular self-assessments');
    
    return recommendations;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // If form is not completed, show warning
  if (!formCompleted) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Warning sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Assessment Form Required
            </Typography>
          </Box>
          
          <Alert 
            severity="warning" 
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
                Complete Your Assessment Form
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                To access your personalized dashboard with academic insights and recommendations, 
                you need to complete the student assessment form first.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Info sx={{ mr: 1, color: 'warning.dark' }} />
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
              startIcon={<Assignment />} 
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
  }

  if (error) {
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

  const { student_info, recommendations, progress_tracking } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              {student_info.name}'s Academic Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Student ID: {student_info.student_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" justifyContent="flex-end">
              {/* Daily Streak Button */}
              <Box sx={{ mr: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleStreakClick}
                  startIcon={<LocalFireDepartment />}
                  disabled={!canUpdateStreak}
                  sx={{ 
                    borderRadius: '50px',
                    px: 3,
                    py: 1.5,
                    boxShadow: 3,
                    '&:hover': {
                      boxShadow: 6
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'grey.500',
                      color: 'white'
                    }
                  }}
                >
                  {streakCount} Day Streak
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {nextUpdateMessage}
                </Typography>
              </Box>
              
              {getRiskIcon(recommendations.dropout_risk)}
              <Box ml={1}>
                <Typography variant="h6">
                  Risk Level: 
                  <Chip 
                    label={recommendations.dropout_risk} 
                    color={getRiskColor(recommendations.dropout_risk)}
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {recommendations.risk_percentage.toFixed(1)}% dropout probability
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Risk Assessment Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error">
                <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                Risk Factors
              </Typography>
              <List dense>
                {recommendations.primary_risk_factors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={factor} />
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
                Protective Factors
              </Typography>
              <List dense>
                {recommendations.protective_factors.map((factor, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={factor} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Recommendations Tabs */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Academic" icon={<School />} />
          <Tab label="Personal Development" icon={<Psychology />} />
          <Tab label="Support Systems" icon={<Family />} />
          <Tab label="Action Plans" icon={<Assignment />} />
          <Tab label="Resources" icon={<BookmarkBorder />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Academic Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Academic Improvements Needed
                </Typography>
                <List>
                  {recommendations.academic_improvements.map((improvement, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TrendingUp color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={improvement} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              
              {/* Subject-Specific Recommendations */}
              {student_info.subjects && student_info.subjects.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Subject-Specific Improvement Recommendations
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Personalized suggestions based on your subject interests and difficulty levels
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {student_info.subjects.map((subject, index) => {
                          const subjectDetails = student_info.subject_details?.[subject] || {};
                          return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Paper sx={{ p: 2, height: '100%' }}>
                                <Box display="flex" alignItems="center" mb={1}>
                                  <School sx={{ mr: 1, color: 'primary.main' }} />
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {subject}
                                  </Typography>
                                </Box>
                                
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                  <Typography variant="body2" color="textSecondary">
                                    Interest: 
                                    <Chip 
                                      label={subjectDetails.interest_level || 'N/A'} 
                                      size="small" 
                                      color={subjectDetails.interest_level > 7 ? 'success' : subjectDetails.interest_level > 4 ? 'warning' : 'error'}
                                      sx={{ ml: 1 }}
                                    />
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Difficulty: 
                                    <Chip 
                                      label={subjectDetails.difficulty_level || 'N/A'} 
                                      size="small" 
                                      color={subjectDetails.difficulty_level > 7 ? 'error' : subjectDetails.difficulty_level > 4 ? 'warning' : 'success'}
                                      sx={{ ml: 1 }}
                                    />
                                  </Typography>
                                </Box>
                                
                                {subjectDetails.challenges && (
                                  <Box mb={1}>
                                    <Typography variant="body2" color="textSecondary">
                                      Challenges: {subjectDetails.challenges}
                                    </Typography>
                                  </Box>
                                )}
                                
                                <Box mt={1}>
                                  <Typography variant="body2" fontWeight="bold" color="primary">
                                    Improvement Focus:
                                  </Typography>
                                  <List dense>
                                    {getSubjectRecommendations(subject, subjectDetails).map((rec, recIndex) => (
                                      <ListItem key={recIndex} sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 24 }}>
                                          <TrendingUp color="primary" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={rec} 
                                          primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  General Subject Focus Areas
                </Typography>
                <List>
                  {recommendations.subject_focus_areas.map((area, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <School color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={area} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}

          {/* Personal Development Tab */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Skills to Develop
                </Typography>
                <List>
                  {recommendations.skill_development.map((skill, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Psychology color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={skill} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Extracurricular Suggestions
                </Typography>
                <List>
                  {recommendations.extracurricular_suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Lightbulb color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}

          {/* Support Systems Tab */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Family Support Suggestions
                </Typography>
                <List>
                  {recommendations.family_support_suggestions.map((suggestion, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Family color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={suggestion} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  School Support Needed
                </Typography>
                <List>
                  {recommendations.school_support_needed.map((support, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <School color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={support} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}

          {/* Action Plans Tab */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" color="error">
                      Immediate Actions (Next 1-2 weeks)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {recommendations.immediate_actions.map((action, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Assignment color="error" />
                          </ListItemIcon>
                          <ListItemText primary={action} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" color="warning.main">
                      Short-term Goals (3-6 months)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {recommendations.short_term_goals.map((goal, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Timeline color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={goal} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" color="success.main">
                      Long-term Goals (1-2 years)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {recommendations.long_term_goals.map((goal, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={goal} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          )}

          {/* Resources Tab */}
          {tabValue === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Recommended Learning Resources
                </Typography>
                <List>
                  {recommendations.recommended_resources.map((resource, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <BookmarkBorder color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={resource} />
                    </ListItem>
                  ))}
                </List>
                
                {recommendations.counseling_needed && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Professional Counseling Recommended
                    </Typography>
                    <Typography>
                      Based on your current situation, we recommend seeking guidance from a school counselor 
                      or educational psychologist to help address specific challenges and develop coping strategies.
                    </Typography>
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Exam Progress Tracker */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <School sx={{ mr: 1, verticalAlign: 'middle' }} />
          Exam Progress Tracker
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Target Exam
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  {student_info?.target_exam || 'Not specified'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your academic preparation focus
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Academic Performance
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Typography variant="h5" color="success.main">
                    {student_info?.tenth_percentage || student_info?.current_gpa || 'N/A'}
                    {student_info?.tenth_percentage || student_info?.current_gpa ? '%' : ''}
                  </Typography>
                  <Chip 
                    label={student_info?.current_class || 'Class not specified'} 
                    size="small" 
                    sx={{ ml: 2 }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Current academic standing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {student_info?.current_stream && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Current Stream:</strong> {student_info.current_stream} | 
                  <strong> Target Exam:</strong> {student_info?.target_exam || 'Please specify your target exam in the assessment form'}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Progress Tracking */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Progress Tracking
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Academic Trend
            </Typography>
            <Box display="flex" alignItems="center">
              <LinearProgress 
                variant="determinate" 
                value={progress_tracking.academic_trend === 'improving' ? 75 : 
                       progress_tracking.academic_trend === 'stable' ? 50 : 25} 
                sx={{ flexGrow: 1, mr: 1 }}
                color={progress_tracking.academic_trend === 'improving' ? 'success' : 
                       progress_tracking.academic_trend === 'stable' ? 'warning' : 'error'}
              />
              <Typography variant="body2" color="text.secondary">
                {progress_tracking.academic_trend}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Attendance Trend
            </Typography>
            <Box display="flex" alignItems="center">
              <LinearProgress 
                variant="determinate" 
                value={progress_tracking.attendance_trend === 'excellent' ? 90 : 
                       progress_tracking.attendance_trend === 'good' ? 70 : 40} 
                sx={{ flexGrow: 1, mr: 1 }}
                color={progress_tracking.attendance_trend === 'excellent' ? 'success' : 
                       progress_tracking.attendance_trend === 'good' ? 'warning' : 'error'}
              />
              <Typography variant="body2" color="text.secondary">
                {progress_tracking.attendance_trend}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Last Updated
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress_tracking.last_updated ? 
                new Date(progress_tracking.last_updated).toLocaleDateString() : 
                'Not available'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default StudentDashboard;