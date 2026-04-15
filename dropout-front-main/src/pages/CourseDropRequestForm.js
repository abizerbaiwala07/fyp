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
  Button,
  Box,
  Alert,
  CircularProgress,
  TextareaAutosize,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CourseDropRequestForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Student Info
    student_id: '',
    full_name: '',
    email: '',
    phone: '',
    
    // Academic Details
    program: '',
    semester: '',
    
    // Drop Details
    course_code: '',
    drop_reason: '',
    other_reason: '',
  });

  const programs = [
    'B.Sc',
    'B.Tech',
    'B.Com',
    'B.A.',
    'M.Sc',
    'M.Tech',
    'M.Com',
    'M.A.',
    'Other'
  ];

  const semesters = [
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester'
  ];

  // Sample course codes - in a real app, this would come from an API
  const courseCodes = [
    'CS101',
    'CS102',
    'MATH101',
    'PHYS101',
    'CHEM101',
    'ENG101',
    'BIO101',
    'ECO101',
    'HIST101',
    'POL101'
  ];

  const dropReasons = [
    'Personal',
    'Medical',
    'Financial',
    'Academic Difficulty',
    'Course Not Required',
    'Other'
  ];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    // Student Info validation
    if (!formData.student_id.trim()) {
      setError('Student ID is required');
      return false;
    }
    
    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Academic Details validation
    if (!formData.program) {
      setError('Program is required');
      return false;
    }
    
    if (!formData.semester) {
      setError('Semester is required');
      return false;
    }
    
    // Drop Details validation
    if (!formData.course_code) {
      setError('Course code is required');
      return false;
    }
    
    if (!formData.drop_reason) {
      setError('Drop reason is required');
      return false;
    }
    
    // Conditional validation for other reason
    if (formData.drop_reason === 'Other' && !formData.other_reason.trim()) {
      setError('Please specify the reason for dropping the course');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real application, you would send this data to your backend:
      /*
      const response = await api.post('/drop-requests', {
        student_id: formData.student_id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        program: formData.program,
        semester: formData.semester,
        course_code: formData.course_code,
        drop_reason: formData.drop_reason,
        other_reason: formData.other_reason,
        status: 'Pending',
        submitted_at: new Date().toISOString()
      });
      */
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/'); // or wherever you want to redirect
      }, 2000);
      
    } catch (err) {
      setError('Failed to submit drop request. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Course Drop Request Form
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Please fill out this form to request dropping a course
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        {success ? (
          <Alert severity="success">
            Course drop request submitted successfully! You will receive a confirmation email shortly.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Student Info Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Student Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Student ID"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    helperText="Your unique student identifier"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    helperText="We'll send confirmation to this email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone (Optional)"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Academic Details Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Academic Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl required fullWidth>
                    <InputLabel>Program</InputLabel>
                    <Select
                      name="program"
                      value={formData.program}
                      label="Program"
                      onChange={handleInputChange}
                    >
                      {programs.map(program => (
                        <MenuItem key={program} value={program}>{program}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl required fullWidth>
                    <InputLabel>Semester</InputLabel>
                    <Select
                      name="semester"
                      value={formData.semester}
                      label="Semester"
                      onChange={handleInputChange}
                    >
                      {semesters.map(semester => (
                        <MenuItem key={semester} value={semester}>{semester}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* Drop Details Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Drop Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl required fullWidth>
                    <InputLabel>Course Code</InputLabel>
                    <Select
                      name="course_code"
                      value={formData.course_code}
                      label="Course Code"
                      onChange={handleInputChange}
                    >
                      {courseCodes.map(code => (
                        <MenuItem key={code} value={code}>{code}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl required fullWidth>
                    <InputLabel>Reason for Dropping</InputLabel>
                    <Select
                      name="drop_reason"
                      value={formData.drop_reason}
                      label="Reason for Dropping"
                      onChange={handleInputChange}
                    >
                      {dropReasons.map(reason => (
                        <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {formData.drop_reason === 'Other' && (
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Please Specify"
                      name="other_reason"
                      multiline
                      rows={3}
                      value={formData.other_reason}
                      onChange={handleInputChange}
                      placeholder="Please provide details about your reason for dropping this course..."
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Submitting...' : 'Submit Drop Request'}
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default CourseDropRequestForm;