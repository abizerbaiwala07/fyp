import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Analytics = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserStats, setCurrentUserStats] = useState(null);

  // Create demo analytics data
  const createDemoAnalytics = () => {
    const demoStudents = [
      { name: 'Aadhya Gupta', dropout_risk: 'Low', tenth_percentage: 87.5, latest_score: 92, progress: 85, target_exam: 'JEE Main' },
      { name: 'Ishaan Mehta', dropout_risk: 'Low', tenth_percentage: 91.2, latest_score: 88, progress: 90, target_exam: 'NEET' },
      { name: 'Kavya Joshi', dropout_risk: 'Medium', tenth_percentage: 84.3, latest_score: 76, progress: 70, target_exam: 'CA Foundation' },
      { name: 'Aryan Desai', dropout_risk: 'Low', tenth_percentage: 89.7, latest_score: 85, progress: 82, target_exam: 'CLAT' },
      { name: 'Diya Agarwal', dropout_risk: 'Low', tenth_percentage: 93.8, latest_score: 95, progress: 95, target_exam: 'JEE Advanced' },
      { name: 'Rohan Kapoor', dropout_risk: 'Low', tenth_percentage: 88.4, latest_score: 83, progress: 78, target_exam: 'JEE Main' },
      { name: 'Ananya Iyer', dropout_risk: 'Low', tenth_percentage: 92.1, latest_score: 89, progress: 87, target_exam: 'DU Entrance' },
      { name: 'Karthik Nair', dropout_risk: 'Medium', tenth_percentage: 86.7, latest_score: 74, progress: 72, target_exam: 'BBA Entrance' },
    ];

    const totalStudents = demoStudents.length;
    const lowRisk = demoStudents.filter(s => s.dropout_risk === 'Low').length;
    const mediumRisk = demoStudents.filter(s => s.dropout_risk === 'Medium').length;
    const highRisk = demoStudents.filter(s => s.dropout_risk === 'High').length;
    const avgScore = demoStudents.reduce((sum, s) => sum + s.latest_score, 0) / totalStudents;
    const avgProgress = demoStudents.reduce((sum, s) => sum + s.progress, 0) / totalStudents;

    return {
      students: demoStudents,
      stats: {
        total_students: totalStudents,
        low_risk: lowRisk,
        medium_risk: mediumRisk,
        high_risk: highRisk,
        average_score: avgScore.toFixed(1),
        average_progress: avgProgress.toFixed(1),
        top_performers: demoStudents.filter(s => s.latest_score >= 85).length,
        needs_attention: demoStudents.filter(s => s.latest_score < 75).length
      }
    };
  };

  // Get current user analytics (demo user)
  const getCurrentUserAnalytics = () => {
    const demoStudentId = localStorage.getItem('demoStudentId');
    const examScores = JSON.parse(localStorage.getItem(`examScores_${demoStudentId}`) || '[]');
    
    // Try to get user data from localStorage (from form submission)
    const userData = JSON.parse(localStorage.getItem('currentUserData') || '{}');
    
    return {
      name: userData.name || 'Current User',
      student_id: demoStudentId || 'STU2024001',
      target_exam: userData.target_exam || 'JEE Main',
      total_attempts: examScores.length,
      latest_score: examScores.length > 0 ? examScores[examScores.length - 1].score : 0,
      highest_score: examScores.length > 0 ? Math.max(...examScores.map(s => s.score)) : 0,
      average_score: examScores.length > 0 ? (examScores.reduce((sum, s) => sum + s.score, 0) / examScores.length).toFixed(1) : 0,
      progress_trend: examScores.length >= 2 ? 
        (examScores[examScores.length - 1].score > examScores[examScores.length - 2].score ? 'Improving' : 'Declining') : 'Stable',
      exam_scores: examScores,
      tenth_percentage: userData.tenth_percentage || 'N/A',
      current_class: userData.current_class || '12th',
      current_stream: userData.current_stream || 'Science'
    };
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Use demo data for analytics
        const demoData = createDemoAnalytics();
        setStudents(demoData.students);
        setStats(demoData.stats);
        
        // Get current user analytics
        const userAnalytics = getCurrentUserAnalytics();
        setCurrentUserStats(userAnalytics);

      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);



  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const pieData = stats ? [
    { name: 'Low Risk', value: stats.low_risk, color: '#4caf50' },
    { name: 'Medium Risk', value: stats.medium_risk, color: '#ff9800' },
    { name: 'High Risk', value: stats.high_risk, color: '#f44336' },
  ] : [];

  const performanceData = [
    { name: 'Top Performers', value: stats?.top_performers || 0, color: '#4caf50' },
    { name: 'Average', value: (stats?.total_students || 0) - (stats?.top_performers || 0) - (stats?.needs_attention || 0), color: '#2196f3' },
    { name: 'Needs Attention', value: stats?.needs_attention || 0, color: '#f44336' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        📊 Analytics Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Your personal analytics and overall system insights
      </Typography>

      {/* Current User Analytics Section */}
      {localStorage.getItem('formCompleted') !== 'true' && (
        <Alert severity="info" sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            📝 Complete Your Assessment First
          </Typography>
          <Typography variant="body1">
            To see your personalized analytics, please complete the student assessment form first.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => window.location.href = '/tenth-standard-form'}
          >
            Start Assessment
          </Button>
        </Alert>
      )}
      
      {currentUserStats && localStorage.getItem('formCompleted') === 'true' && (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 4, background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white' }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            👤 Your Performance Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {currentUserStats.name} - {currentUserStats.student_id}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                🎯 Target Exam: {currentUserStats.target_exam} | 📚 {currentUserStats.current_class} {currentUserStats.current_stream}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Attempts</Typography>
                  <Typography variant="h4">{currentUserStats.total_attempts}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Latest Score</Typography>
                  <Typography variant="h4">{currentUserStats.latest_score}%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Highest Score</Typography>
                  <Typography variant="h4">{currentUserStats.highest_score}%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Average Score</Typography>
                  <Typography variant="h4">{currentUserStats.average_score}%</Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>Progress Trend</Typography>
                <Typography variant="h5" sx={{ 
                  color: currentUserStats.progress_trend === 'Improving' ? '#4caf50' : 
                         currentUserStats.progress_trend === 'Declining' ? '#f44336' : '#fff'
                }}>
                  {currentUserStats.progress_trend === 'Improving' ? '📈 Improving' : 
                   currentUserStats.progress_trend === 'Declining' ? '📉 Declining' : '📊 Stable'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  10th Percentage: {currentUserStats.tenth_percentage !== 'N/A' ? `${currentUserStats.tenth_percentage}%` : 'Not Available'}
                </Typography>
                {JSON.parse(localStorage.getItem('currentUserData') || '{}').current_attendance && (
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Current Attendance: {JSON.parse(localStorage.getItem('currentUserData') || '{}').current_attendance}%
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h4">
                {stats?.total_students || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h4">
                {stats?.average_score || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Top Performers
              </Typography>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>
                {stats?.top_performers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Needs Attention
              </Typography>
              <Typography variant="h4" sx={{ color: '#f44336' }}>
                {stats?.needs_attention || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Risk Distribution Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Risk Level Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Performance Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Student Performance Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Student Performance Overview
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Target Exam</TableCell>
                        <TableCell align="right">10th %</TableCell>
                        <TableCell align="right">Latest Score</TableCell>
                        <TableCell align="right">Progress</TableCell>
                        <TableCell>Risk Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student, index) => (
                        <TableRow key={index}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.target_exam}</TableCell>
                          <TableCell align="right">{student.tenth_percentage}%</TableCell>
                          <TableCell align="right">{student.latest_score}%</TableCell>
                          <TableCell align="right">{student.progress}%</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                color: 'white',
                                fontSize: '0.75rem',
                                backgroundColor: 
                                  student.dropout_risk === 'Low' ? '#4caf50' :
                                  student.dropout_risk === 'Medium' ? '#ff9800' : '#f44336'
                              }}
                            >
                              {student.dropout_risk}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;