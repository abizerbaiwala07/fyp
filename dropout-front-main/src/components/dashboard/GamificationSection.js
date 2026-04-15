import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Typography, LinearProgress, Avatar, AvatarGroup, Button } from '@mui/material';
import { EmojiEvents, RocketLaunch, ArrowForward } from '@mui/icons-material';
import GlassCard from './GlassCard';

/**
 * GamificationSection - Displays user level, XP progress, and recent badges.
 */
const GamificationSection = ({ currentXP = 0, currentLevel = 1, achievements }) => {
  const { studentId } = useParams();
  
  // High-fidelity Level/XP logic 
  const nextLevelXP = 100; // Standard 100 XP per level
  const progressPercentage = (currentXP / nextLevelXP) * 100;

  // Render earned badges
  const unlockedAchievements = achievements?.filter(a => a.unlocked) || [];

  return (
    <GlassCard>
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
              <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>{currentLevel}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Study Progress</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'var(--neon-green)' }}>{currentXP} Hrs XP</Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{nextLevelXP} Hrs</Typography>
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
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
            <EmojiEvents sx={{ fontSize: 16, mr: 0.5, color: 'gold' }} /> 
            Recent Badges
          </Typography>
          <Button 
            component={Link} 
            to={`/achievements/${studentId || 'default'}`} 
            size="small"
            endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            sx={{ 
              color: 'var(--neon-blue)', 
              fontSize: '0.7rem', 
              p: 0, 
              minWidth: 'auto',
              '&:hover': { background: 'transparent', textDecoration: 'underline' }
            }}
          >
            View Catalog
          </Button>
        </Box>
        {unlockedAchievements.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1,
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }
          }}>
            {unlockedAchievements.slice(-4).map((achievement, i) => (
              <Box key={achievement.id || i} sx={{ 
                minWidth: 60,
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.05)',
                p: 1,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}>
                <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{achievement.icon || '🏆'}</Typography>
                <Typography variant="caption" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', fontSize: '0.65rem' }}>
                  {achievement.title}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ opacity: 0.5 }}>Start studying to earn badges!</Typography>
        )}
      </Box>
    </GlassCard>
  );
};

export default GamificationSection;
