import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  LocalHospital as HealthIcon,
  AttachMoney as MoneyIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import RiskMeter from '../components/RiskMeter';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false);
  const [interventionForm, setInterventionForm] = useState({
    counselor_name: '',
    intervention_type: '',
    description: '',
    action_taken: '',
    follow_up_date: '',
  });

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [studentResponse, interventionsResponse] = await Promise.all([
        studentAPI.getStudentById(id),
        studentAPI.getStudentInterventions(id)
      ]);
      
      setStudent(studentResponse.data);
      setInterventions(interventionsResponse.data);
    } catch (err) {
      setError('Failed to fetch student data');
      console.error('Student detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchStudentData();
    };
    loadData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInterventionSubmit = async () => {
    try {
      await studentAPI.createIntervention(id, interventionForm);
      setInterventionDialogOpen(false);
      setInterventionForm({
        counselor_name: '',
        intervention_type: '',
        description: '',
        action_taken: '',
        follow_up_date: '',
      });
      // Refresh interventions
      const interventionsResponse = await studentAPI.getStudentInterventions(id);
      setInterventions(interventionsResponse.data);
    } catch (err) {
      console.error('Error creating intervention:', err);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !student) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Student not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/students')}
          sx={{ mb: 2 }}
        >
          Back to Students
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2, width: 56, height: 56, bgcolor: 'primary.main' }}>
              {getInitials(student.name)}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                {student.name}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Student ID: {student.student_id}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mr: 2 }}
              onClick={() => navigate(`/edit-student/${id}`)}
            >
              Edit Student
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setInterventionDialogOpen(true)}
            >
              Add Intervention
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Risk Assessment */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dropout Risk Assessment
              </Typography>
              <RiskMeter 
                probability={student.dropout_probability}
                riskLevel={student.risk_level}
                size="large"
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Last Updated: {formatDate(student.updated_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Age:</strong> {student.age} years
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Gender:</strong> {student.gender}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Distance from Home:</strong> {student.distance_from_home?.toFixed(1)} km
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Parent Education:</strong> {student.parent_education_level}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      <strong>Family Income:</strong> {student.family_income_level}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Financial Aid:</strong> {student.financial_aid ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {student.part_time_job && (
                  <Chip icon={<WorkIcon />} label="Part-time Job" size="small" />
                )}
                {student.health_issues && (
                  <Chip icon={<HealthIcon />} label="Health Issues" size="small" color="warning" />
                )}
                {student.financial_aid && (
                  <Chip icon={<MoneyIcon />} label="Financial Aid" size="small" color="info" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Academic Performance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary">
                      {student.current_gpa?.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Current GPA
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary">
                      {student.previous_gpa?.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Previous GPA
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color="primary">
                      {student.attendance_rate?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Attendance Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="h4" color={student.failed_subjects > 0 ? 'error' : 'primary'}>
                      {student.failed_subjects}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Failed Subjects
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Activity Participation:</strong> {student.participation_activities}/10
                </Typography>
                <Typography variant="body2">
                  <strong>Study Hours/Week:</strong> {student.study_hours_per_week} hours
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Interventions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Interventions & Actions
              </Typography>
              
              {interventions.length === 0 ? (
                <Alert severity="info">
                  No interventions recorded yet.
                </Alert>
              ) : (
                <List>
                  {interventions.map((intervention, index) => (
                    <React.Fragment key={intervention.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <NoteIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={intervention.intervention_type}
                          secondary={
                            <>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Counselor:</strong> {intervention.counselor_name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Description:</strong> {intervention.description}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                <strong>Action:</strong> {intervention.action_taken}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatDate(intervention.created_at)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < interventions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Intervention Dialog */}
      <Dialog 
        open={interventionDialogOpen} 
        onClose={() => setInterventionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Intervention</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Counselor Name"
                value={interventionForm.counselor_name}
                onChange={(e) => setInterventionForm(prev => ({
                  ...prev,
                  counselor_name: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Intervention Type</InputLabel>
                <Select
                  value={interventionForm.intervention_type}
                  label="Intervention Type"
                  onChange={(e) => setInterventionForm(prev => ({
                    ...prev,
                    intervention_type: e.target.value
                  }))}
                >
                  <MenuItem value="Academic Support">Academic Support</MenuItem>
                  <MenuItem value="Counseling">Counseling</MenuItem>
                  <MenuItem value="Financial Aid">Financial Aid</MenuItem>
                  <MenuItem value="Mentoring">Mentoring</MenuItem>
                  <MenuItem value="Health Support">Health Support</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={interventionForm.description}
                onChange={(e) => setInterventionForm(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Action Taken"
                value={interventionForm.action_taken}
                onChange={(e) => setInterventionForm(prev => ({
                  ...prev,
                  action_taken: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={interventionForm.follow_up_date}
                onChange={(e) => setInterventionForm(prev => ({
                  ...prev,
                  follow_up_date: e.target.value
                }))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterventionDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleInterventionSubmit}
            variant="contained"
            disabled={!interventionForm.counselor_name || !interventionForm.intervention_type}
          >
            Add Intervention
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDetail;