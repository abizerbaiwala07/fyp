import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { tenthStandardAPI } from '../services/api';

const steps = [
  'Basic Information',
  'Academic Performance',
  'Family Background',
  'Personal Factors',
  'Goals & Exam Details'
];

const TenthStandardForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    age: '',
    gender: '',
    
    // Academic Performance
    tenth_percentage: '',
    math_marks: '',
    science_marks: '',
    english_marks: '',
    current_class: '',
    current_stream: '',
    current_attendance: '',
    failed_subjects_current: '',
    
    // Family Background
    parent_education: '',
    family_income: '',
    financial_support: false,
    distance_from_school: '',
    
    // Personal Factors
    study_hours_daily: '',
    extracurricular_participation: '',
    has_part_time_work: false,
    health_issues: false,
    internet_access: false,
    
    // Goals & Aspirations
    career_goal: '',
    higher_education_plan: '',
    
    // Exam Information
    target_exam: '',
    exam_start_month: '',
    exam_end_month: '',
    preparation_months: ''
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.age || formData.age < 14 || formData.age > 18) {
          setError('Age is required and must be between 14-18');
          return false;
        }
        if (!formData.gender) {
          setError('Gender is required');
          return false;
        }
        break;
        
      case 1: // Academic Performance
        if (!formData.tenth_percentage || formData.tenth_percentage < 0 || formData.tenth_percentage > 100) {
          setError('10th Standard Percentage is required (0-100)');
          return false;
        }
        if (!formData.math_marks || formData.math_marks < 0 || formData.math_marks > 100) {
          setError('Mathematics marks are required (0-100)');
          return false;
        }
        if (!formData.science_marks || formData.science_marks < 0 || formData.science_marks > 100) {
          setError('Science marks are required (0-100)');
          return false;
        }
        if (!formData.english_marks || formData.english_marks < 0 || formData.english_marks > 100) {
          setError('English marks are required (0-100)');
          return false;
        }
        if (!formData.current_class) {
          setError('Current class is required');
          return false;
        }
        if (!formData.current_stream) {
          setError('Current stream is required');
          return false;
        }
        if (!formData.current_attendance || formData.current_attendance < 0 || formData.current_attendance > 100) {
          setError('Current attendance is required (0-100)');
          return false;
        }
        if (formData.failed_subjects_current === '' || formData.failed_subjects_current < 0) {
          setError('Number of failed subjects is required');
          return false;
        }
        break;
        
      case 2: // Family Background
        if (!formData.parent_education) {
          setError('Parent education is required');
          return false;
        }
        if (!formData.family_income) {
          setError('Family income is required');
          return false;
        }
        if (!formData.distance_from_school || formData.distance_from_school < 0) {
          setError('Distance from school is required');
          return false;
        }
        break;
        
      case 3: // Personal Factors
        if (!formData.study_hours_daily || formData.study_hours_daily < 0 || formData.study_hours_daily > 24) {
          setError('Daily study hours are required (0-24)');
          return false;
        }
        if (formData.extracurricular_participation === '' || formData.extracurricular_participation < 0 || formData.extracurricular_participation > 10) {
          setError('Extracurricular participation level is required (0-10)');
          return false;
        }
        break;
        
      case 4: // Goals & Aspirations + Exam Info
        if (!formData.career_goal.trim()) {
          setError('Career goal is required');
          return false;
        }
        if (!formData.higher_education_plan.trim()) {
          setError('Higher education plan is required');
          return false;
        }
        if (!formData.target_exam.trim()) {
          setError('Target exam is required');
          return false;
        }
        if (!formData.exam_start_month) {
          setError('Exam start month is required');
          return false;
        }
        if (!formData.exam_end_month) {
          setError('Exam end month is required');
          return false;
        }
        if (!formData.preparation_months || formData.preparation_months < 1) {
          setError('Preparation months are required (minimum 1)');
          return false;
        }
        break;
        
      default:
        return true;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate all fields before submission
      if (!validateStep(4)) {
        setLoading(false);
        return;
      }

      // Convert string numbers to actual numbers
      const processedData = {
        ...formData,
        age: parseInt(formData.age),
        tenth_percentage: parseFloat(formData.tenth_percentage),
        math_marks: parseFloat(formData.math_marks),
        science_marks: parseFloat(formData.science_marks),
        english_marks: parseFloat(formData.english_marks),
        current_attendance: parseFloat(formData.current_attendance),
        failed_subjects_current: parseInt(formData.failed_subjects_current),
        distance_from_school: parseFloat(formData.distance_from_school),
        study_hours_daily: parseFloat(formData.study_hours_daily),
        extracurricular_participation: parseInt(formData.extracurricular_participation),
        preparation_months: parseInt(formData.preparation_months)
      };

      const response = await tenthStandardAPI.submitForm(processedData);
      
      setSuccess('Student profile created successfully!');
      
      // Store student ID for future dashboard access
      localStorage.setItem('demoStudentId', response.data.student.student_id);
      
      // Store user data for analytics and dashboard
      localStorage.setItem('currentUserData', JSON.stringify({
        name: processedData.name,
        tenth_percentage: processedData.tenth_percentage,
        current_class: processedData.current_class,
        current_stream: processedData.current_stream,
        current_attendance: processedData.current_attendance,
        target_exam: processedData.target_exam,
        age: processedData.age,
        gender: processedData.gender
      }));
      
      // Mark that form has been completed
      localStorage.setItem('formCompleted', 'true');
      
      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/student-dashboard/${response.data.student.student_id}`);
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      
      let errorMessage = 'Error submitting form. Please try again.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // Handle Pydantic validation errors
            errorMessage = errorData.detail.map(error => {
              const field = Array.isArray(error.loc) ? error.loc.join(' → ') : 'Field';
              const message = error.msg || 'Invalid value';
              return `${field}: ${message}`;
            }).join('; ');
          } else {
            errorMessage = 'Validation error occurred';
          }
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle FastAPI validation errors format
          errorMessage = errorData.errors.map(error => {
            const field = Array.isArray(error.loc) ? error.loc.filter(loc => loc !== 'body').join(' → ') : 'Field';
            const message = error.msg || 'Invalid value';
            return `${field}: ${message}`;
          }).join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          // Fallback for any other object format
          errorMessage = JSON.stringify(errorData);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="age"
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                inputProps={{ min: 14, max: 18 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Academic Performance
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="tenth_percentage"
                label="10th Standard Percentage"
                type="number"
                value={formData.tenth_percentage}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                name="math_marks"
                label="Mathematics Marks"
                type="number"
                value={formData.math_marks}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                name="science_marks"
                label="Science Marks"
                type="number"
                value={formData.science_marks}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                name="english_marks"
                label="English Marks"
                type="number"
                value={formData.english_marks}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Current Class</InputLabel>
                <Select
                  name="current_class"
                  value={formData.current_class}
                  onChange={handleChange}
                  label="Current Class"
                >
                  <MenuItem value="11th">11th Standard</MenuItem>
                  <MenuItem value="12th">12th Standard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Current Stream</InputLabel>
                <Select
                  name="current_stream"
                  value={formData.current_stream}
                  onChange={handleChange}
                  label="Current Stream"
                >
                  <MenuItem value="Science">Science</MenuItem>
                  <MenuItem value="Commerce">Commerce</MenuItem>
                  <MenuItem value="Arts">Arts</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="current_attendance"
                label="Current Attendance %"
                type="number"
                value={formData.current_attendance}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="failed_subjects_current"
                label="Failed Subjects (Current)"
                type="number"
                value={formData.failed_subjects_current}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Family Background
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Parent's Education</InputLabel>
                <Select
                  name="parent_education"
                  value={formData.parent_education}
                  onChange={handleChange}
                  label="Parent's Education"
                >
                  <MenuItem value="Below 10th">Below 10th</MenuItem>
                  <MenuItem value="10th">10th Standard</MenuItem>
                  <MenuItem value="12th">12th Standard</MenuItem>
                  <MenuItem value="Graduate">Graduate</MenuItem>
                  <MenuItem value="Post-Graduate">Post-Graduate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Family Income</InputLabel>
                <Select
                  name="family_income"
                  value={formData.family_income}
                  onChange={handleChange}
                  label="Family Income"
                >
                  <MenuItem value="Below 2L">Below ₹2 Lakhs</MenuItem>
                  <MenuItem value="2-5L">₹2-5 Lakhs</MenuItem>
                  <MenuItem value="5-10L">₹5-10 Lakhs</MenuItem>
                  <MenuItem value="Above 10L">Above ₹10 Lakhs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="distance_from_school"
                label="Distance from School (km)"
                type="number"
                value={formData.distance_from_school}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="financial_support"
                    checked={formData.financial_support}
                    onChange={handleChange}
                  />
                }
                label="Receives scholarship or financial aid"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Factors
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="study_hours_daily"
                label="Daily Study Hours"
                type="number"
                value={formData.study_hours_daily}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="extracurricular_participation"
                label="Extracurricular Participation (0-10)"
                type="number"
                value={formData.extracurricular_participation}
                onChange={handleChange}
                inputProps={{ min: 0, max: 10 }}
                helperText="Rate your participation in sports, clubs, etc. (0=None, 10=Very Active)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="has_part_time_work"
                    checked={formData.has_part_time_work}
                    onChange={handleChange}
                  />
                }
                label="Does part-time work or helps in family business"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="health_issues"
                    checked={formData.health_issues}
                    onChange={handleChange}
                  />
                }
                label="Has health issues that affect studies"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="internet_access"
                    checked={formData.internet_access}
                    onChange={handleChange}
                  />
                }
                label="Has reliable internet access at home"
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Goals & Aspirations
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="career_goal"
                label="Career Goal"
                value={formData.career_goal}
                onChange={handleChange}
                placeholder="e.g., Engineering, Medicine, Business, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="higher_education_plan"
                label="Higher Education Plan"
                value={formData.higher_education_plan}
                onChange={handleChange}
                placeholder="e.g., Engineering College, Medical College, etc."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Target Exam Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="target_exam"
                label="Target Exam"
                value={formData.target_exam}
                onChange={handleChange}
                placeholder="e.g., JEE Main, NEET, CET, etc."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="preparation_months"
                label="Preparation Duration (Months)"
                type="number"
                value={formData.preparation_months}
                onChange={handleChange}
                inputProps={{ min: 1, max: 36 }}
                helperText="How many months are you preparing for this exam?"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam Start Month</InputLabel>
                <Select
                  name="exam_start_month"
                  value={formData.exam_start_month}
                  onChange={handleChange}
                  label="Exam Start Month"
                >
                  <MenuItem value="January">January</MenuItem>
                  <MenuItem value="February">February</MenuItem>
                  <MenuItem value="March">March</MenuItem>
                  <MenuItem value="April">April</MenuItem>
                  <MenuItem value="May">May</MenuItem>
                  <MenuItem value="June">June</MenuItem>
                  <MenuItem value="July">July</MenuItem>
                  <MenuItem value="August">August</MenuItem>
                  <MenuItem value="September">September</MenuItem>
                  <MenuItem value="October">October</MenuItem>
                  <MenuItem value="November">November</MenuItem>
                  <MenuItem value="December">December</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Exam End Month</InputLabel>
                <Select
                  name="exam_end_month"
                  value={formData.exam_end_month}
                  onChange={handleChange}
                  label="Exam End Month"
                >
                  <MenuItem value="January">January</MenuItem>
                  <MenuItem value="February">February</MenuItem>
                  <MenuItem value="March">March</MenuItem>
                  <MenuItem value="April">April</MenuItem>
                  <MenuItem value="May">May</MenuItem>
                  <MenuItem value="June">June</MenuItem>
                  <MenuItem value="July">July</MenuItem>
                  <MenuItem value="August">August</MenuItem>
                  <MenuItem value="September">September</MenuItem>
                  <MenuItem value="October">October</MenuItem>
                  <MenuItem value="November">November</MenuItem>
                  <MenuItem value="December">December</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, mb: 4, px: { xs: 1, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Student Assessment Form
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary">
          Help us understand your academic journey to provide personalized guidance
        </Typography>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit & Get Analysis'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default TenthStandardForm;