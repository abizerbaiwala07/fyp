import React, { useState, useEffect } from 'react';
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
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { studentAPI, authAPI } from '../services/api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

const steps = [
  'Basic Information',
  'Academic Background',
  'Current Status',
  'Study Habits & Lifestyle',
  'Goals & Aspirations',
  'Exam Preparation'
];

const ComprehensiveStudentForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  // If user already completed form earlier, redirect to dashboard on mount
  useEffect(() => {
    const studentId = localStorage.getItem('demoStudentId');
    const formCompleted = localStorage.getItem('formCompleted') === 'true';
    if (formCompleted && studentId) {
      navigate(`/student-dashboard/${studentId}`);
    }
  }, [navigate]);

  // Helper: ensure tokens before protected API calls
  const ensureAuthTokens = async () => {
    // Prefer backend JWT
    let jwt = localStorage.getItem('jwt_token');
    if (jwt) return true;

    // Try Clerk -> backend sync
    try {
      const clerkToken = localStorage.getItem('clerk_token');
      if (!clerkToken) return false;
      
      try {
        const resp = await authAPI.clerkAuth(clerkToken);
        if (resp.data?.access_token) {
          localStorage.setItem('jwt_token', resp.data.access_token);
          return true;
        }
      } catch (e) {
        console.warn('Failed to get backend JWT from clerk_token:', e);
      }
    } catch (e) {
      console.warn('Clerk token not available while ensuring tokens:', e);
    }
    return false;
  };

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    age: '',
    gender: '',
    
    // Academic Background
    tenth_percentage: '',
    math_marks: '',
    science_marks: '',
    english_marks: '',
    
    // Educational Path
    educational_path: '', // ITI, Diploma, Stream
    stream: '', // Science, Commerce, Arts (if Stream is selected)
    current_level: '', // 11th, 12th, 1st Year, 2nd Year, etc.
    
    // Current Status
    current_institution: '',
    current_course: '',
    current_attendance: '',
    failed_subjects_current: '',
    
    // Study Habits & Lifestyle
    study_hours_daily: '',
    extracurricular_participation: '5',
    has_part_time_work: false,
    health_issues: false,
    internet_access: true,
    distance_from_school: '5',
    
    // Goals & Aspirations
    career_goal: '',
    higher_education_plan: '',
    academic_focus: '',
    study_motivation: '',
    
    // Degree Information (for students who completed 12th)
    degree_type: '',
    degree_year: '',
    current_cgpa: '',
    
    // Exam Information
    target_exam: '',
    exam_year: '',
    exam_start_month: '',
    exam_end_month: '',
    preparation_months: ''
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      
      // Reset dependent fields when educational path changes
      if (name === 'educational_path') {
        newData.stream = '';
        newData.current_level = '';
      }
      
      // Reset degree fields when current_level changes
      if (name === 'current_level') {
        if (value !== 'After 12th') {
          newData.degree_type = '';
          newData.degree_year = '';
          newData.current_cgpa = '';
        }
      }
      
      return newData;
    });
  };

  const validateStep = (step) => {
    setError('');
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.name.trim()) {
          setError('Name is required');
          return false;
        }
        if (!formData.age || formData.age < 14 || formData.age > 25) {
          setError('Age is required and must be between 14-25');
          return false;
        }
        if (!formData.gender) {
          setError('Gender is required');
          return false;
        }
        break;
        
      case 1: // Academic Background
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
        if (!formData.educational_path) {
          setError('Educational path is required');
          return false;
        }
        if (formData.educational_path === 'Stream' && !formData.stream) {
          setError('Please select a stream');
          return false;
        }
        break;
        
      case 2: // Current Status
        if (!formData.current_level) {
          setError('Current level is required');
          return false;
        }
        if (!formData.current_institution.trim()) {
          setError('Current institution is required');
          return false;
        }
        if (!formData.current_course.trim()) {
          setError('Current course is required');
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
        
      case 3: // Study Habits & Lifestyle
        if (!formData.study_hours_daily || formData.study_hours_daily < 0) {
          setError('Daily study hours are required');
          return false;
        }
        if (formData.extracurricular_participation === '' || formData.extracurricular_participation < 0 || formData.extracurricular_participation > 10) {
          setError('Extracurricular participation level is required (0-10)');
          return false;
        }
        if (!formData.distance_from_school || formData.distance_from_school < 0) {
          setError('Distance from school is required');
          return false;
        }
        break;
        
      case 4: // Goals & Aspirations
        if (!formData.career_goal) {
          setError('Career goal is required');
          return false;
        }
        if (!formData.higher_education_plan) {
          setError('Higher education plan is required');
          return false;
        }
        if (!formData.academic_focus) {
          setError('Academic focus area is required');
          return false;
        }
        if (!formData.study_motivation) {
          setError('Study motivation is required');
          return false;
        }
        break;
        
      case 5: // Exam Preparation
        if (!formData.target_exam) {
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
        if (!formData.preparation_months || formData.preparation_months < 1 || formData.preparation_months > 36) {
          setError('Preparation months must be between 1-36');
          return false;
        }
        if (formData.current_level === 'After 12th' && (!formData.degree_type || !formData.degree_year || !formData.current_cgpa)) {
          setError('Please fill in all degree information fields');
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Ensure tokens; if not available, redirect to login
    const hasTokens = await ensureAuthTokens();
    if (!hasTokens) {
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      // Validate all fields before submission
      for (let i = 0; i < steps.length; i++) {
        if (!validateStep(i)) {
          setActiveStep(i);
          setLoading(false);
          return;
        }
      }

      // Processed data was previously computed but unused; remove to avoid ESLint warnings

      // Map form data to backend StudentCreate schema and create student
      const genId = () => `STU${new Date().toISOString().slice(0,10).replace(/-/g, '')}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const baseGpa = Math.min(4, Math.max(0, (parseFloat(formData.tenth_percentage) || 75) / 25));

      const studentPayload = {
        student_id: genId(),
        name: formData.name,
        age: parseInt(formData.age) || 16,
        gender: formData.gender,
        current_gpa: baseGpa,
        previous_gpa: Math.max(0, baseGpa - 0.2),
        attendance_rate: parseFloat(formData.current_attendance) || 85,
        failed_subjects: parseInt(formData.failed_subjects_current) || 0,
        participation_activities: parseInt(formData.extracurricular_participation) || 0,
        parent_education_level: 'Graduate', // Default value since we removed parent info
        financial_aid: false, // Default value since we removed parent info
        family_income_level: '2-5L', // Default value since we removed parent info
        distance_from_home: parseFloat(formData.distance_from_school) || 5,
        study_hours_per_week: (parseFloat(formData.study_hours_daily) || 4) * 7,
        part_time_job: !!formData.has_part_time_work,
        health_issues: !!formData.health_issues,
      };

      const response = await studentAPI.createStudent(studentPayload);

      setSuccess('Student profile created successfully! Redirecting to your dashboard...');

      // Store student ID and mark form as completed
      const studentId = response.data.student_id;
      localStorage.setItem('demoStudentId', studentId);
      localStorage.setItem('formCompleted', 'true');

      // Mark form as completed in backend (best-effort)
      try {
        await authAPI.markFormCompleted(studentId);
      } catch (markError) {
        console.warn('Failed to mark form as completed in backend:', markError);
      }

      // Navigate to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/student-dashboard/${studentId}`);
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      
      // Handle different types of errors
      let errorMessage = 'Error submitting form. Please try again.';
      
      if (err.response?.data?.detail) {
        // Handle FastAPI validation errors
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(error => 
            `${error.loc?.join(' -> ') || 'Field'}: ${error.msg}`
          ).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevelOptions = () => {
    if (formData.educational_path === 'ITI') {
      return [
        { value: '1st Year ITI', label: '1st Year ITI' },
        { value: '2nd Year ITI', label: '2nd Year ITI' }
      ];
    } else if (formData.educational_path === 'Diploma') {
      return [
        { value: '1st Year Diploma', label: '1st Year Diploma' },
        { value: '2nd Year Diploma', label: '2nd Year Diploma (Direct Entry)' },
        { value: '3rd Year Diploma', label: '3rd Year Diploma' }
      ];
    } else if (formData.educational_path === 'Stream') {
      return [
        { value: '11th', label: '11th Standard' },
        { value: '12th', label: '12th Standard' },
        { value: 'After 12th', label: 'Completed 12th (Looking for Degree)' }
      ];
    }
    return [];
  };

  const getExamOptions = () => {
    const examCategories = {
      'Academic Board Exams': [
        'CBSE 11th Board Exams',
        'CBSE 12th Board Exams',
        'State Board 11th Exams',
        'State Board 12th Exams',
        'ICSE 11th Exams',
        'ICSE 12th Exams',
        'Academic Improvement Exams'
      ],
      'Engineering Entrance': [
        'JEE Main',
        'JEE Advanced',
        'BITSAT',
        'VITEEE',
        'COMEDK',
        'MHT CET',
        'KCET',
        'EAMCET',
        'WBJEE',
        'OJEE',
        'GUJCET',
        'UPSEE',
        'TNEA',
        'KEAM'
      ],
      'Medical Entrance': [
        'NEET UG',
        'NEET PG',
        'AIIMS',
        'JIPMER'
      ],
      'General Entrance': [
        'CUET',
        'CUCET',
        'IPU CET',
        'BHU UET',
        'DUET'
      ],
      'Law Entrance': [
        'CLAT',
        'AILET',
        'LSAT India',
        'SLAT'
      ],
      'Management Entrance': [
        'CAT',
        'XAT',
        'SNAP',
        'NMAT',
        'MAT',
        'CMAT'
      ],
      'Technical/Diploma': [
        'Diploma CET',
        'ITI Entrance',
        'Polytechnic Entrance',
        'BCECE',
        'JCECE',
        'REAP'
      ],
      'International Exams': [
        'GMAT',
        'GRE',
        'TOEFL',
        'IELTS',
        'SAT',
        'ACT'
      ],
      'Academic Focus': [
        'Academic Excellence (No specific exam)',
        'Subject Mastery (Mathematics)',
        'Subject Mastery (Physics)',
        'Subject Mastery (Chemistry)',
        'Subject Mastery (Biology)',
        'Subject Mastery (Commerce)',
        'Subject Mastery (Arts/Humanities)',
        'Overall Academic Performance',
        'Scholarship Exams (NTSE, KVPY, etc.)'
      ]
    };
    
    // Flatten all exams into a single array with category prefixes for clarity
    const allExams = [];
    Object.entries(examCategories).forEach(([category, exams]) => {
      exams.forEach(exam => {
        allExams.push(`${exam}`);
      });
    });
    
    allExams.push('Other');
    
    return allExams;
  };

  const getRecommendedPath = () => {
    if (!formData.educational_path || !formData.current_level) return '';
    
    if (formData.educational_path === 'Diploma') {
      if (formData.current_level.includes('2nd Year')) {
        return 'Great! You can directly enter 2nd year of diploma program, saving time and focusing on advanced subjects.';
      } else if (formData.current_level.includes('1st Year')) {
        return 'Starting with 1st year diploma will give you a strong foundation in your chosen field.';
      }
    } else if (formData.educational_path === 'Stream') {
      if (formData.current_level === 'After 12th') {
        return 'Perfect! You can now apply for degree colleges, entrance exams, and pursue higher education in your chosen field.';
      } else if (formData.current_level === '12th') {
        return 'Focus on your 12th board exams and entrance exam preparation for the best college admissions.';
      } else if (formData.current_level === '11th') {
        return 'Build a strong foundation in 11th standard to excel in 12th and entrance exams.';
      }
    } else if (formData.educational_path === 'ITI') {
      return 'ITI programs provide excellent practical skills and direct pathways to employment in technical fields.';
    }
    
    return '';
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0: // Basic Information
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="age"
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                inputProps={{ min: 14, max: 25 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
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

      case 1: // Academic Background
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                10th Standard Academic Performance
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="tenth_percentage"
                label="10th Standard Percentage"
                type="number"
                value={formData.tenth_percentage}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="math_marks"
                label="Mathematics Marks"
                type="number"
                value={formData.math_marks}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="science_marks"
                label="Science Marks"
                type="number"
                value={formData.science_marks}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="english_marks"
                label="English Marks"
                type="number"
                value={formData.english_marks}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Educational Path
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Choose Your Path</InputLabel>
                <Select
                  name="educational_path"
                  value={formData.educational_path}
                  onChange={handleChange}
                  label="Choose Your Path"
                >
                  <MenuItem value="ITI">ITI (Industrial Training Institute) - 2 Years</MenuItem>
                  <MenuItem value="Diploma">Diploma - 3 Years (Direct 2nd Year after 10th)</MenuItem>
                  <MenuItem value="Stream">Stream (11th/12th Standard) - Academic Path</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.educational_path === 'Stream' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel>Select Stream</InputLabel>
                  <Select
                    name="stream"
                    value={formData.stream}
                    onChange={handleChange}
                    label="Select Stream"
                  >
                    <MenuItem value="Science">Science</MenuItem>
                    <MenuItem value="Commerce">Commerce</MenuItem>
                    <MenuItem value="Arts">Arts</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {formData.educational_path && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" required>
                  <InputLabel>Current Level</InputLabel>
                  <Select
                    name="current_level"
                    value={formData.current_level}
                    onChange={handleChange}
                    label="Current Level"
                  >
                    {getCurrentLevelOptions().map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {getRecommendedPath() && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Recommended Path:</strong> {getRecommendedPath()}
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      case 2: // Current Status
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="current_institution"
                label="Current Institution/School/College"
                value={formData.current_institution}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="current_course"
                label="Current Course/Subject"
                value={formData.current_course}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="current_attendance"
                label="Current Attendance %"
                type="number"
                value={formData.current_attendance}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="failed_subjects_current"
                label="Failed Subjects (Current)"
                type="number"
                value={formData.failed_subjects_current}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                variant="outlined"
              />
            </Grid>
          </Grid>
        );

      case 3: // Study Habits & Lifestyle
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="study_hours_daily"
                label="Daily Study Hours"
                type="number"
                value={formData.study_hours_daily}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.5 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="distance_from_school"
                label="Distance from School (km)"
                type="number"
                value={formData.distance_from_school}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.1 }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <input
                      type="checkbox"
                      name="has_part_time_work"
                      checked={formData.has_part_time_work}
                      onChange={handleChange}
                      id="partTimeWork"
                    />
                    <label htmlFor="partTimeWork" style={{ marginLeft: 8 }}>
                      Does part-time work or helps in family business
                    </label>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <input
                      type="checkbox"
                      name="health_issues"
                      checked={formData.health_issues}
                      onChange={handleChange}
                      id="healthIssues"
                    />
                    <label htmlFor="healthIssues" style={{ marginLeft: 8 }}>
                      Has health issues that affect studies
                    </label>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <input
                      type="checkbox"
                      name="internet_access"
                      checked={formData.internet_access}
                      onChange={handleChange}
                      id="internetAccess"
                    />
                    <label htmlFor="internetAccess" style={{ marginLeft: 8 }}>
                      Has reliable internet access at home
                    </label>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );

      case 4: // Goals & Aspirations
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Career Goal</InputLabel>
                <Select
                  name="career_goal"
                  value={formData.career_goal}
                  onChange={handleChange}
                  label="Career Goal"
                >
                  <MenuItem value="Academic Excellence">🎓 Academic Excellence & Higher Studies</MenuItem>
                  <MenuItem value="Engineering">⚙️ Engineering</MenuItem>
                  <MenuItem value="Medicine">🏥 Medicine & Healthcare</MenuItem>
                  <MenuItem value="Research & Academia">🔬 Research & Academia</MenuItem>
                  <MenuItem value="Teaching">👨‍🏫 Teaching & Education</MenuItem>
                  <MenuItem value="Science & Technology">🧪 Science & Technology</MenuItem>
                  <MenuItem value="Business & Management">💼 Business & Management</MenuItem>
                  <MenuItem value="Law & Legal Services">⚖️ Law & Legal Services</MenuItem>
                  <MenuItem value="Arts & Literature">🎨 Arts & Literature</MenuItem>
                  <MenuItem value="Commerce & Finance">💰 Commerce & Finance</MenuItem>
                  <MenuItem value="Government Services">🏛️ Government Services (IAS, IPS, etc.)</MenuItem>
                  <MenuItem value="Technical Skills">🔧 Technical Skills & Trades</MenuItem>
                  <MenuItem value="Entrepreneurship">🚀 Entrepreneurship</MenuItem>
                  <MenuItem value="Creative Fields">🎭 Creative Fields (Design, Media, etc.)</MenuItem>
                  <MenuItem value="Sports & Fitness">⚽ Sports & Fitness</MenuItem>
                  <MenuItem value="Social Work">🤝 Social Work & NGO</MenuItem>
                  <MenuItem value="Undecided">🤔 Still Exploring Options</MenuItem>
                  <MenuItem value="Other">📝 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Higher Education Plan</InputLabel>
                <Select
                  name="higher_education_plan"
                  value={formData.higher_education_plan}
                  onChange={handleChange}
                  label="Higher Education Plan"
                >
                  <MenuItem value="Focus on Academics">📚 Focus on Academic Performance</MenuItem>
                  <MenuItem value="Engineering College">⚙️ Engineering College (B.Tech/B.E.)</MenuItem>
                  <MenuItem value="Medical College">🏥 Medical College (MBBS/BDS)</MenuItem>
                  <MenuItem value="Science Degree">🧪 Science Degree (B.Sc.)</MenuItem>
                  <MenuItem value="Commerce Degree">💼 Commerce Degree (B.Com/BBA)</MenuItem>
                  <MenuItem value="Arts Degree">🎨 Arts Degree (B.A.)</MenuItem>
                  <MenuItem value="Law Degree">⚖️ Law Degree (LLB)</MenuItem>
                  <MenuItem value="Diploma Course">📜 Diploma Course</MenuItem>
                  <MenuItem value="ITI Course">🔧 ITI Course</MenuItem>
                  <MenuItem value="Professional Course">💼 Professional Course (CA, CS, etc.)</MenuItem>
                  <MenuItem value="Research Programs">🔬 Research Programs (M.Sc., Ph.D.)</MenuItem>
                  <MenuItem value="International Studies">🌍 International Studies</MenuItem>
                  <MenuItem value="Skill Development">🛠️ Skill Development Programs</MenuItem>
                  <MenuItem value="Job After 12th">💼 Direct Job After 12th</MenuItem>
                  <MenuItem value="Undecided">🤔 Still Deciding</MenuItem>
                  <MenuItem value="Other">📝 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Academic Focus Area</InputLabel>
                <Select
                  name="academic_focus"
                  value={formData.academic_focus}
                  onChange={handleChange}
                  label="Academic Focus Area"
                >
                  <MenuItem value="Overall Academic Excellence">🏆 Overall Academic Excellence</MenuItem>
                  <MenuItem value="Mathematics Mastery">🔢 Mathematics Mastery</MenuItem>
                  <MenuItem value="Science Excellence">🧪 Science Excellence (Physics, Chemistry, Biology)</MenuItem>
                  <MenuItem value="Language Skills">📖 Language Skills (English, Literature)</MenuItem>
                  <MenuItem value="Commerce & Economics">💰 Commerce & Economics</MenuItem>
                  <MenuItem value="Social Studies">🏛️ Social Studies & History</MenuItem>
                  <MenuItem value="Computer Science">💻 Computer Science & Programming</MenuItem>
                  <MenuItem value="Arts & Creativity">🎨 Arts & Creativity</MenuItem>
                  <MenuItem value="Research Skills">🔍 Research & Analytical Skills</MenuItem>
                  <MenuItem value="Practical Skills">🛠️ Practical & Technical Skills</MenuItem>
                  <MenuItem value="Communication">🗣️ Communication & Presentation</MenuItem>
                  <MenuItem value="Problem Solving">🧩 Problem Solving & Critical Thinking</MenuItem>
                  <MenuItem value="Balanced Approach">⚖️ Balanced Academic Approach</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Study Motivation</InputLabel>
                <Select
                  name="study_motivation"
                  value={formData.study_motivation}
                  onChange={handleChange}
                  label="Study Motivation"
                >
                  <MenuItem value="Academic Achievement">🏆 Academic Achievement & Good Grades</MenuItem>
                  <MenuItem value="Knowledge & Learning">📚 Love for Knowledge & Learning</MenuItem>
                  <MenuItem value="Career Preparation">🎯 Career Preparation</MenuItem>
                  <MenuItem value="Entrance Exam Success">📝 Entrance Exam Success</MenuItem>
                  <MenuItem value="Family Expectations">👨‍👩‍👧‍👦 Family Expectations</MenuItem>
                  <MenuItem value="Personal Growth">🌱 Personal Growth & Development</MenuItem>
                  <MenuItem value="Future Security">🛡️ Future Security & Stability</MenuItem>
                  <MenuItem value="Helping Others">🤝 Helping Family & Society</MenuItem>
                  <MenuItem value="Competition">🏃‍♂️ Healthy Competition with Peers</MenuItem>
                  <MenuItem value="Self Improvement">📈 Continuous Self Improvement</MenuItem>
                  <MenuItem value="Scholarship Goals">🎓 Scholarship & Merit Goals</MenuItem>
                  <MenuItem value="Multiple Motivations">🌟 Multiple Motivations</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 5: // Exam Preparation
        return (
          <Grid container spacing={2}>
            {/* Degree Information (only for students who completed 12th) */}
            {formData.current_level === 'After 12th' && (
              <Grid item xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">🎓 Degree Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth variant="outlined" required>
                          <InputLabel>Degree Type</InputLabel>
                          <Select
                            name="degree_type"
                            value={formData.degree_type}
                            onChange={handleChange}
                            label="Degree Type"
                          >
                            <MenuItem value="B.Tech">B.Tech</MenuItem>
                            <MenuItem value="B.Sc">B.Sc</MenuItem>
                            <MenuItem value="B.Com">B.Com</MenuItem>
                            <MenuItem value="B.A.">B.A.</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="degree_year"
                          label="Year of Study"
                          value={formData.degree_year}
                          onChange={handleChange}
                          variant="outlined"
                          placeholder="1st, 2nd, 3rd Year"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          name="current_cgpa"
                          label="Current CGPA/Percentage"
                          value={formData.current_cgpa}
                          onChange={handleChange}
                          variant="outlined"
                          placeholder="Current CGPA or Percentage"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Exam Preparation Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Target Exam</InputLabel>
                <Select
                  name="target_exam"
                  value={formData.target_exam}
                  onChange={handleChange}
                  label="Target Exam"
                >
                  {getExamOptions().map((exam) => (
                    <MenuItem key={exam} value={exam}>
                      {exam}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="exam_year"
                label="Exam Year"
                type="number"
                value={formData.exam_year}
                onChange={handleChange}
                inputProps={{ min: new Date().getFullYear(), max: new Date().getFullYear() + 5 }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="exam_start_month"
                label="Exam Start Month"
                value={formData.exam_start_month}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="exam_end_month"
                label="Exam End Month"
                value={formData.exam_end_month}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="preparation_months"
                label="Months of Preparation"
                type="number"
                value={formData.preparation_months}
                onChange={handleChange}
                inputProps={{ min: 1, max: 36 }}
                variant="outlined"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Student Information Form
        </Typography>
        <Typography variant="subtitle1" align="center" color="textSecondary" sx={{ mb: 3 }}>
          Please provide detailed information about yourself to help us create a personalized learning path
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 3 }}>
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel>
                <Typography variant="subtitle2">{label}</Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {renderStepContent(index)}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    {index !== 0 && (
                      <Button onClick={handleBack} sx={{ mr: 1 }}>
                        Back
                      </Button>
                    )}
                    {index === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        {loading ? 'Submitting...' : 'Submit Form'}
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ComprehensiveStudentForm;