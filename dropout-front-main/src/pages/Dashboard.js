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
  Chip,
  Button,
  Paper,
} from '@mui/material';
import {
  People as PeopleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { studentAPI } from '../services/api';
import StudentCard from '../components/StudentCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if form has been completed
      const formCompleted = localStorage.getItem('formCompleted') === 'true';
      
      if (formCompleted) {
        // If form is completed, try to get real data, fallback to demo data
        try {
          const [statsResponse, studentsResponse] = await Promise.all([
            studentAPI.getStudentStats(),
            studentAPI.getAllStudents({ limit: 6 })
          ]);
          setStats(statsResponse.data);
          setStudents(studentsResponse.data);
        } catch (apiErr) {
          // Fallback to demo data if API fails
          console.log('API failed, using demo data');
          setStats({
            total_students: 1,
            low_risk: 1,
            medium_risk: 0,
            high_risk: 0
          });
          
          // Get user data from localStorage
          const userData = JSON.parse(localStorage.getItem('currentUserData') || '{}');
          if (userData.name) {
            setStudents([{
              id: 'user_001',
              student_id: localStorage.getItem('demoStudentId') || 'STU2024001',
              name: userData.name,
              age: userData.age || 17,
              gender: userData.gender || 'Not specified',
              current_class: userData.current_class || '12th',
              current_stream: userData.current_stream || 'Science',
              tenth_percentage: userData.tenth_percentage || 0,
              current_attendance: userData.current_attendance || 0,
              dropout_risk: 'Low',
              risk_percentage: 15,
              target_exam: userData.target_exam || 'JEE Main',
              latest_score: 85,
              progress: 80,
              created_at: new Date().toISOString().split('T')[0]
            }]);
          } else {
            setStudents([]);
          }
        }
      } else {
        // If form not completed, show empty stats
        setStats({
          total_students: 0,
          low_risk: 0,
          medium_risk: 0,
          high_risk: 0
        });
        setStudents([]);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
    { name: 'Low Risk', value: stats.low_risk, color: '#388e3c' },
    { name: 'Medium Risk', value: stats.medium_risk, color: '#f57c00' },
    { name: 'High Risk', value: stats.high_risk, color: '#d32f2f' },
  ] : [];

  const barData = stats ? [
    { name: 'Low Risk', count: stats.low_risk, fill: '#388e3c' },
    { name: 'Medium Risk', count: stats.medium_risk, fill: '#f57c00' },
    { name: 'High Risk', count: stats.high_risk, fill: '#d32f2f' },
  ] : [];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Overview of student dropout risk assessment
      </Typography>

      {/* New Student Assessment Call-to-Action */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center" mb={1}>
              <AssignmentIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5" component="h2">
                New Student Assessment
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Help students understand their academic journey with our comprehensive assessment form. 
              Get personalized recommendations and improvement strategies based on 10th standard performance.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ✓ Personalized risk assessment  ✓ Academic improvement suggestions  ✓ Career guidance
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/tenth-standard-form')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              Start Assessment
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3} key="total-students">
          <StatCard
            title="Total Students"
            value={stats?.total_students || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="primary.main"
            subtitle="Enrolled students"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="high-risk">
          <StatCard
            title="High Risk"
            value={stats?.high_risk || 0}
            icon={<ErrorIcon sx={{ fontSize: 40 }} />}
            color="#d32f2f"
            subtitle="Immediate attention needed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="medium-risk">
          <StatCard
            title="Medium Risk"
            value={stats?.medium_risk || 0}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="#f57c00"
            subtitle="Monitor closely"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="low-risk">
          <StatCard
            title="Low Risk"
            value={stats?.low_risk || 0}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            color="#388e3c"
            subtitle="Performing well"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} key="risk-distribution-chart">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Distribution
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
        <Grid item xs={12} md={6} key="student-count-chart">
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Student Count by Risk Level
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Students */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUpIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Recent Students
            </Typography>
          </Box>
          
          {students.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: 'center' }}>
              {localStorage.getItem('formCompleted') === 'true' 
                ? 'No student data available. Please check your connection or try refreshing the page.'
                : (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      📝 Complete your student assessment to see your personalized dashboard!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fill out the assessment form above to get started with your academic journey analysis.
                    </Typography>
                  </Box>
                )
              }
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {students.slice(0, 6).map((student) => (
                <Grid item xs={12} sm={6} md={4} key={student.id}>
                  <StudentCard student={student} />
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Dashboard;