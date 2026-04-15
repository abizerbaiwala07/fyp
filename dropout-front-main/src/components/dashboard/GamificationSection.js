import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Typography, LinearProgress, Button, Skeleton } from '@mui/material';
import { EmojiEvents, ArrowForward, LocalFireDepartment, AutoGraph } from '@mui/icons-material';
import GlassCard from './GlassCard';
import { useGamification } from '../../contexts/GamificationContext';

/**
 * GamificationSection - Displays user level, XP progress, streaks, and recent badges.
 * Reads data from real-time GamificationContext.
 */
const GamificationSection = () => {
  const { studentId } = useParams();
  const { studentData, loading } = useGamification();
  
  if (loading && !studentData) {
    return (
      <GlassCard>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={80} height={80} sx={{ mr: 3 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={30} />
            <Skeleton variant="rectangular" width="100%" height={10} sx={{ mt: 1, borderRadius: 5 }} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 2 }} />
      </GlassCard>
    );
  }

  const {
    xp = 0,
    current_level = 1,
    streak = 0,
    total_study_hours = 0,
    badges = []
  } = studentData || {};

  // High-fidelity Level/XP logic 
  const nextLevelXP = 100; // Standard 100 XP per level
  const xpInCurrentLevel = xp % nextLevelXP;
  const progressPercentage = (xpInCurrentLevel / nextLevelXP) * 100;

  return (
    <GlassCard>
      {/* Level & XP Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ 
          position: 'relative', 
          display: 'inline-flex',
          mr: 3
        }}>
          {/* Neon Avatar/Level Ring */}
          <Box sx={{
            width: 80, 
            height: 80, 
            borderRadius: '50%',
            background: 'conic-gradient(var(--neon-purple) 0%, var(--neon-blue) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(176, 38, 255, 0.4)',
            animation: 'spin 10s linear infinite',
            '@keyframes spin': {
              '100%': { transform: 'rotate(360deg)' }
            }
          }}>
            <Box sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              zIndex: 1,
              animation: 'spin-reverse 10s linear infinite',
              '@keyframes spin-reverse': {
                '100%': { transform: 'rotate(-360deg)' }
              }
            }}>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', lineHeight: 1 }}>LVL</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>{current_level}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Overall Progress</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--neon-orange)' }}>
              <LocalFireDepartment sx={{ fontSize: 18, mr: 0.2 }} />
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{streak} Day Streak</Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>{xpInCurrentLevel} / {nextLevelXP} XP</Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{total_study_hours.toFixed(1)} Total Hrs</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, var(--neon-purple) 0%, var(--neon-blue) 100%)',
                borderRadius: 5,
                boxShadow: '0 0 10px var(--neon-blue)'
              }
            }} 
          />
        </Box>
      </Box>

      {/* Badges Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <EmojiEvents sx={{ fontSize: 16, mr: 0.5, color: 'gold' }} /> 
            Recent Achievements
          </Typography>
          <Button 
            component={Link} 
            to={`/achievements/${studentId || 'default'}`} 
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            sx={{ 
              color: 'var(--neon-blue)', 
              fontSize: '0.65rem', 
              p: 0, 
              minWidth: 'auto',
              '&:hover': { background: 'transparent', textDecoration: 'underline' }
            }}
          >
            Catalog
          </Button>
        </Box>
        
        {badges.length > 0 ? (
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            overflowX: 'auto', 
            pb: 1,
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }
          }}>
            {badges.slice(-4).reverse().map((badge, i) => (
              <Box key={badge.id || i} sx={{ 
                minWidth: 70,
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                p: 1.5,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  transform: 'translateY(-4px) scale(1.05)', 
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderColor: 'var(--neon-blue)',
                  boxShadow: '0 4px 15px rgba(0, 163, 255, 0.2)'
                }
              }}>
                <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>{badge.icon || '🏆'}</Typography>
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  width: '100%', 
                  fontSize: '0.6rem',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold'
                }}>
                  {badge.title}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: 2, 
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <Typography variant="body2" sx={{ opacity: 0.5, fontSize: '0.75rem' }}>
              Keep studying to earn your first badge! 🎓
            </Typography>
          </Box>
        )}
      </Box>
    </GlassCard>
  );
};

export default GamificationSection;
