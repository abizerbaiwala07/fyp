import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../services/api';
import RiskMeter from '../components/RiskMeter';

const AddStudent = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    age: '',
    gender: '',
    current_gpa: '',
    previous_gpa: '',
    attendance_rate: '',
    failed_subjects: '',
    participation_activities: '',
    parent_education_level: '',
    financial_aid: false,
    family_income_level: '',
    distance_from_home: '',
    study_hours_per_week: '',
    part_time_job: false,
    health_issues: false,
  });

  const steps = ['Basic Information', 'Academic Details', 'Background & Preview'];

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        return formData.student_id && formData.name && formData.age && formData.gender;
      case 1:
        return formData.current_gpa && formData.previous_gpa && formData.attendance_rate !== '';
      case 2:
        return formData.parent_education_level && formData.family_income_level;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Final step - get prediction
      await getPrediction();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getPrediction = async () => {
    try {
      setLoading(true);
      const studentData = {
        ...formData,
        age: parseInt(formData.age),
        current_gpa: parseFloat(formData.current_gpa),
        previous_gpa: parseFloat(formData.previous_gpa),
        attendance_rate: parseFloat(formData.attendance_rate),
        failed_subjects: parseInt(formData.failed_subjects) || 0,
        participation_activities: parseInt(formData.participation_activities) || 0,
        distance_from_home: parseFloat(formData.distance_from_home) || 0,
        study_hours_per_week: parseFloat(formData.study_hours_per_week) || 0,
      };

      const response = await studentAPI.predictDropout(studentData);
      setPrediction(response.data);
    } catch (err) {
      setError('Failed to get prediction');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentData = {
        ...formData,
        age: parseInt(formData.age),
        current_gpa: parseFloat(formData.current_gpa),
        previous_gpa: parseFloat(formData.previous_gpa),
        attendance_rate: parseFloat(formData.attendance_rate),
        failed_subjects: parseInt(formData.failed_subjects) || 0,
        participation_activities: parseInt(formData.participation_activities) || 0,
        distance_from_home: parseFloat(formData.distance_from_home) || 0,
        study_hours_per_week: parseFloat(formData.study_hours_per_week) || 0,
      };

      await studentAPI.createStudent(studentData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/students');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create student');
      console.error('Create student error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Student ID"
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                helperText="Unique identifier for the student"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                inputProps={{ min: 16, max: 30 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Current GPA"
                name="current_gpa"
                type="number"
                value={formData.current_gpa}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 4, step: 0.01 }}
                helperText="Scale: 0.0 - 4.0"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Previous Semester GPA"
                name="previous_gpa"
                type="number"
                value={formData.previous_gpa}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 4, step: 0.01 }}
                helperText="Scale: 0.0 - 4.0"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Attendance Rate (%)"
                name="attendance_rate"
                type="number"
                value={formData.attendance_rate}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Failed Subjects"
                name="failed_subjects"
                type="number"
                value={formData.failed_subjects}
                onChange={handleInputChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Activity Participation Level"
                name="participation_activities"
                type="number"
                value={formData.participation_activities}
                onChange={handleInputChange}
                inputProps={{ min: 0, max: 10 }}
                helperText="Scale: 0-10"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Study Hours per Week"
                name="study_hours_per_week"
                type="number"
                value={formData.study_hours_per_week}
                onChange={handleInputChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel>Parent's Education Level</InputLabel>
                <Select
                  name="parent_education_level"
                  value={formData.parent_education_level}
                  label="Parent's Education Level"
                  onChange={handleInputChange}
                >
                  <MenuItem value="No Education">No Education</MenuItem>
                  <MenuItem value="Primary">Primary</MenuItem>
                  <MenuItem value="Secondary">Secondary</MenuItem>
                  <MenuItem value="High School">High School</MenuItem>
                  <MenuItem value="Bachelor">Bachelor's Degree</MenuItem>
                  <MenuItem value="Master">Master's Degree</MenuItem>
                  <MenuItem value="PhD">PhD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth>
                <InputLabel>Family Income Level</InputLabel>
                <Select
                  name="family_income_level"
                  value={formData.family_income_level}
                  label="Family Income Level"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Lower-Middle">Lower-Middle</MenuItem>
                  <MenuItem value="Middle">Middle</MenuItem>
                  <MenuItem value="Upper-Middle">Upper-Middle</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distance from Home (km)"
                name="distance_from_home"
                type="number"
                value={formData.distance_from_home}
                onChange={handleInputChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.financial_aid}
                      onChange={handleInputChange}
                      name="financial_aid"
                    />
                  }
                  label="Receives Financial Aid"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.part_time_job}
                    onChange={handleInputChange}
                    name="part_time_job"
                  />
                }
                label="Has Part-time Job"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.health_issues}
                    onChange={handleInputChange}
                    name="health_issues"
                  />
                }
                label="Has Health Issues"
              />
            </Grid>

            {/* Prediction Preview */}
            {prediction && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mt: 2, bgcolor: 'background.default' }}>
                  <Typography variant="h6" gutterBottom>
                    Dropout Risk Prediction
                  </Typography>
                  <RiskMeter 
                    probability={prediction.dropout_probability}
                    riskLevel={prediction.risk_level}
                    size="large"
                  />
                  
                  {prediction.factors && Object.keys(prediction.factors).length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Risk Factors:
                      </Typography>
                      {Object.entries(prediction.factors).map(([factor, description]) => (
                        <Typography key={factor} variant="body2" color="text.secondary">
                          • <strong>{factor}:</strong> {description}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container maxWidth="md">
        <Alert severity="success" sx={{ mt: 4 }}>
          Student created successfully! Redirecting to students list...
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/students')}
          sx={{ mb: 2 }}
        >
          Back to Students
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Student
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Enter student information to assess dropout risk
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <>
                {!prediction && (
                  <Button
                    variant="outlined"
                    startIcon={<PreviewIcon />}
                    onClick={getPrediction}
                    disabled={loading || !validateStep(activeStep)}
                    sx={{ mr: 2 }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Get Prediction'}
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading || !prediction}
                >
                  {loading ? <CircularProgress size={20} /> : 'Create Student'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateStep(activeStep)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddStudent;