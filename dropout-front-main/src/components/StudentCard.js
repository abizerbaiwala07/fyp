import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RiskMeter from './RiskMeter';

const StudentCard = ({ student }) => {
  const navigate = useNavigate();

  const getRiskChipClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return 'risk-chip-high';
      case 'medium':
        return 'risk-chip-medium';
      case 'low':
        return 'risk-chip-low';
      default:
        return '';
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

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-2px)' },
          boxShadow: { xs: 2, sm: 4 },
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Avatar sx={{ 
            mr: { xs: 0, sm: 2 }, 
            mb: { xs: 1, sm: 0 },
            bgcolor: 'primary.main',
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 }
          }}>
            {getInitials(student.name)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                wordBreak: 'break-word',
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              {student.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {student.student_id}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => navigate(`/student/${student.id}`)}
            sx={{ 
              ml: { xs: 0, sm: 1 },
              mt: { xs: 1, sm: 0 },
              position: { xs: 'absolute', sm: 'static' },
              top: { xs: 8, sm: 'auto' },
              right: { xs: 8, sm: 'auto' }
            }}
          >
            <ViewIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 2 }}>
          <RiskMeter 
            probability={student.risk_percentage || student.dropout_probability} 
            riskLevel={student.dropout_risk || student.risk_level}
            size="small"
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: { xs: 0.5, sm: 1 }, 
          mb: 2,
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}>
          <Chip
            label={`10th: ${student.tenth_percentage ? `${student.tenth_percentage}%` : student.current_gpa ? `${student.current_gpa.toFixed(2)}%` : 'Not Available'}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
          />
          <Chip
            label={`Class: ${student.current_class || 'Not Specified'}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
          />
          {student.current_stream && (
            <Chip
              label={student.current_stream}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.8125rem' } }}
            />
          )}
        </Box>

        {/* Progress Section */}
        {student.progress && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={student.progress} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: student.progress >= 80 ? '#4caf50' : student.progress >= 60 ? '#ff9800' : '#f44336'
                }
              }} 
            />
          </Box>
        )}

        {/* Exam Information */}
        {student.target_exam && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Target: {student.target_exam}
            </Typography>
            {student.latest_score && (
              <Chip
                label={`Latest Score: ${student.latest_score}%`}
                size="small"
                color={student.latest_score >= 80 ? 'success' : student.latest_score >= 60 ? 'warning' : 'error'}
              />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Age: {student.age} • {student.gender}
          </Typography>
          <Chip
            label={student.dropout_risk || student.risk_level || 'Unknown'}
            size="small"
            className={getRiskChipClass(student.dropout_risk || student.risk_level)}
          />
        </Box>

        {student.failed_subjects > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="error">
              Failed Subjects: {student.failed_subjects}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentCard;