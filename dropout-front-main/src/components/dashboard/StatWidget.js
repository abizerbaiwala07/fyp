import React from 'react';
import { Box, Typography } from '@mui/material';
import GlassCard from './GlassCard';

/**
 * StatWidget - Displays small numeric metrics with an associated icon and color.
 * Used for Gamification like Level, XP, Streak count.
 */
const StatWidget = ({ title, value, subtitle, icon, color = 'var(--neon-blue)' }) => {
  return (
    <GlassCard hover={true} sx={{
      display: 'flex',
      alignItems: 'center',
      p: 2,
    }}>
      <Box sx={{ 
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        borderRadius: '12px',
        p: 1.5,
        mr: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        boxShadow: `0 0 10px ${color}40`
      }}>
        {icon}
      </Box>
      <Box flex={1}>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 500, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline' }}>
          {value}
          {subtitle && (
            <Typography variant="caption" sx={{ ml: 1, color: 'var(--text-secondary)' }}>
              {subtitle}
            </Typography>
          )}
        </Typography>
      </Box>
    </GlassCard>
  );
};

export default StatWidget;
