import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import StudentCard from '../components/StudentCard';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 12;

  const createDemoStudents = () => {
    return [
      {
        id: 'demo_001',
        student_id: 'STU2024001',
        name: 'Aadhya Gupta',
        age: 17,
        gender: 'Female',
        current_class: '12th',
        current_stream: 'Science',
        tenth_percentage: 87.5,
        dropout_risk: 'Low',
        risk_percentage: 15,
        target_exam: 'JEE Main',
        latest_score: 92,
        progress: 85,
        created_at: '2024-01-15'
      },
      {
        id: 'demo_002',
        student_id: 'STU2024002',
        name: 'Ishaan Mehta',
        age: 16,
        gender: 'Male',
        current_class: '11th',
        current_stream: 'Science',
        tenth_percentage: 91.2,
        dropout_risk: 'Low',
        risk_percentage: 8,
        target_exam: 'NEET',
        latest_score: 88,
        progress: 90,
        created_at: '2024-01-20'
      },
      {
        id: 'demo_003',
        student_id: 'STU2024003',
        name: 'Kavya Joshi',
        age: 17,
        gender: 'Female',
        current_class: '12th',
        current_stream: 'Commerce',
        tenth_percentage: 84.3,
        dropout_risk: 'Medium',
        risk_percentage: 35,
        target_exam: 'CA Foundation',
        latest_score: 76,
        progress: 70,
        created_at: '2024-02-01'
      },
      {
        id: 'demo_004',
        student_id: 'STU2024004',
        name: 'Aryan Desai',
        age: 16,
        gender: 'Male',
        current_class: '11th',
        current_stream: 'Arts',
        tenth_percentage: 89.7,
        dropout_risk: 'Low',
        risk_percentage: 12,
        target_exam: 'CLAT',
        latest_score: 85,
        progress: 82,
        created_at: '2024-02-10'
      },
      {
        id: 'demo_005',
        student_id: 'STU2024005',
        name: 'Diya Agarwal',
        age: 17,
        gender: 'Female',
        current_class: '12th',
        current_stream: 'Science',
        tenth_percentage: 93.8,
        dropout_risk: 'Low',
        risk_percentage: 5,
        target_exam: 'JEE Advanced',
        latest_score: 95,
        progress: 95,
        created_at: '2024-02-15'
      },
      {
        id: 'demo_006',
        student_id: 'STU2024006',
        name: 'Rohan Kapoor',
        age: 16,
        gender: 'Male',
        current_class: '11th',
        current_stream: 'Science',
        tenth_percentage: 88.4,
        dropout_risk: 'Low',
        risk_percentage: 18,
        target_exam: 'JEE Main',
        latest_score: 83,
        progress: 78,
        created_at: '2024-02-20'
      },
      {
        id: 'demo_007',
        student_id: 'STU2024007',
        name: 'Ananya Iyer',
        age: 17,
        gender: 'Female',
        current_class: '12th',
        current_stream: 'Arts',
        tenth_percentage: 92.1,
        dropout_risk: 'Low',
        risk_percentage: 10,
        target_exam: 'DU Entrance',
        latest_score: 89,
        progress: 87,
        created_at: '2024-02-25'
      },
      {
        id: 'demo_008',
        student_id: 'STU2024008',
        name: 'Karthik Nair',
        age: 16,
        gender: 'Male',
        current_class: '11th',
        current_stream: 'Commerce',
        tenth_percentage: 86.7,
        dropout_risk: 'Medium',
        risk_percentage: 28,
        target_exam: 'BBA Entrance',
        latest_score: 74,
        progress: 72,
        created_at: '2024-03-01'
      },
      {
        id: 'demo_009',
        student_id: 'STU2024009',
        name: 'Riya Sharma',
        age: 17,
        gender: 'Female',
        current_class: '12th',
        current_stream: 'Science',
        tenth_percentage: 90.3,
        dropout_risk: 'Low',
        risk_percentage: 12,
        target_exam: 'BITSAT',
        latest_score: 87,
        progress: 84,
        created_at: '2024-03-05'
      },
      {
        id: 'demo_010',
        student_id: 'STU2024010',
        name: 'Aditya Verma',
        age: 16,
        gender: 'Male',
        current_class: '11th',
        current_stream: 'Science',
        tenth_percentage: 85.9,
        dropout_risk: 'Low',
        risk_percentage: 20,
        target_exam: 'JEE Main',
        latest_score: 81,
        progress: 76,
        created_at: '2024-03-10'
      },
      {
        id: 'demo_011',
        student_id: 'STU2024011',
        name: 'Meera Kulkarni',
        age: 17,
        gender: 'Female',
        current_class: '12th',
        current_stream: 'Arts',
        tenth_percentage: 88.6,
        dropout_risk: 'Low',
        risk_percentage: 15,
        target_exam: 'BHU Entrance',
        latest_score: 86,
        progress: 80,
        created_at: '2024-03-12'
      },
      {
        id: 'demo_012',
        student_id: 'STU2024012',
        name: 'Arjun Reddy',
        age: 16,
        gender: 'Male',
        current_class: '11th',
        current_stream: 'Commerce',
        tenth_percentage: 82.4,
        dropout_risk: 'Medium',
        risk_percentage: 32,
        target_exam: 'BBA Entrance',
        latest_score: 71,
        progress: 68,
        created_at: '2024-03-15'
      }
    ];
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const demoStudents = createDemoStudents();
      setStudents(demoStudents);
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Students fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (riskFilter) {
      filtered = filtered.filter(student => 
        (student.dropout_risk || student.risk_level) === riskFilter
      );
    }

    if (performanceFilter === 'top_performers') {
      filtered = filtered.filter(student => 
        (student.latest_score >= 80) || (student.progress >= 80) || (student.tenth_percentage >= 85)
      );
    } else if (performanceFilter === 'needs_attention') {
      filtered = filtered.filter(student => 
        (student.latest_score < 60) || (student.progress < 60) || (student.tenth_percentage < 70)
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchStudents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, riskFilter, performanceFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRiskFilterChange = (event) => {
    setRiskFilter(event.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRiskFilter('');
    setPerformanceFilter('');
  };

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Students
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Monitor student academic progress and performance
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search students"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={riskFilter}
                label="Risk Level"
                onChange={handleRiskFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Low">Low Risk</MenuItem>
                <MenuItem value="Medium">Medium Risk</MenuItem>
                <MenuItem value="High">High Risk</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Performance</InputLabel>
              <Select
                value={performanceFilter}
                label="Performance"
                onChange={(e) => setPerformanceFilter(e.target.value)}
              >
                <MenuItem value="">All Students</MenuItem>
                <MenuItem value="top_performers">🌟 Top Performers</MenuItem>
                <MenuItem value="needs_attention">⚠️ Needs Attention</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={clearFilters}
              fullWidth
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results Summary */}
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: 2 
      }}>
        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Showing {currentStudents.length} of {filteredStudents.length} students
        </Typography>
        {(searchTerm || riskFilter || performanceFilter) && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {searchTerm && (
              <Chip
                label={`Search: "${searchTerm}"`}
                onDelete={() => setSearchTerm('')}
                size="small"
              />
            )}
            {riskFilter && (
              <Chip
                label={`Risk: ${riskFilter}`}
                onDelete={() => setRiskFilter('')}
                size="small"
              />
            )}
            {performanceFilter && (
              <Chip
                label={`Performance: ${performanceFilter === 'top_performers' ? 'Top Performers' : 'Needs Attention'}`}
                onDelete={() => setPerformanceFilter('')}
                size="small"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Students Grid */}
      {currentStudents.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {filteredStudents.length === 0 && students.length === 0
            ? 'No students found. Add some students to get started.'
            : 'No students match your current filters.'}
        </Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {currentStudents.map((student) => (
              <Grid item xs={12} sm={6} md={4} key={student.id}>
                <StudentCard student={student} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Students;