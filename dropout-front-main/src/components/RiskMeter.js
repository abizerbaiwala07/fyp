import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { Warning, CheckCircle, Error } from '@mui/icons-material';

const RiskMeter = ({ probability, riskLevel, size = 'medium' }) => {

  const getRiskIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return <Error />;
      case 'medium':
        return <Warning />;
      case 'low':
        return <CheckCircle />;
      default:
        return null;
    }
  };

  const getProgressColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'primary';
    }
  };

  const probabilityPercent = Math.round((probability || 0) * 100);

  return (
    <Box sx={{ width: '100%', maxWidth: size === 'large' ? 400 : 300 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant={size === 'large' ? 'h6' : 'body1'} sx={{ flexGrow: 1 }}>
          Dropout Risk
        </Typography>
        <Chip
          icon={getRiskIcon(riskLevel)}
          label={`${riskLevel || 'Unknown'} (${probabilityPercent}%)`}
          color={getProgressColor(riskLevel)}
          variant="outlined"
          size={size === 'large' ? 'medium' : 'small'}
        />
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={probabilityPercent}
        color={getProgressColor(riskLevel)}
        sx={{
          height: size === 'large' ? 12 : 8,
          borderRadius: 6,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 6,
          },
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Low Risk
        </Typography>
        <Typography variant="caption" color="text.secondary">
          High Risk
        </Typography>
      </Box>
    </Box>
  );
};

export default RiskMeter;