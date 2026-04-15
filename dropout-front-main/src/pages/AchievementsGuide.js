import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, LinearProgress, CircularProgress, Alert, Button, Divider
} from '@mui/material';
import { ArrowBack, EmojiEvents, Whatshot, School, AutoGraph, Lock, AutoAwesome } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { studentAPI, tenthStandardAPI } from '../services/api';
import streakService from '../services/streakService';
import GlassCard from '../components/dashboard/GlassCard';

const BADGE_CATALOG = [
  // Performance
  { id: 'top_scorer', title: 'Top Scorer', description: 'Achieve >90% on a major test.', icon: <AutoGraph />, category: 'Performance', metricTarget: 90, color: 'var(--neon-purple)' },
  { id: 'math_master', title: 'Math Master', description: 'Complete 5 math modules perfectly.', icon: <School />, category: 'Performance', metricTarget: 5, color: 'var(--neon-blue)' },
  { id: 'first_mock_test', title: 'First Mock Test Completed', description: 'Conquer your very first practice examination.', icon: <EmojiEvents />, category: 'Performance', metricTarget: 1, isUnlocked: true, unlockedDate: '2026-04-12', color: 'var(--neon-green)' },
  
  // Streaks
  { id: 'streak_3', title: '3-Day Streak', description: 'Study 3 days in a row.', icon: <Whatshot />, category: 'Streak', metricTarget: 3, color: 'var(--neon-orange)' },
  { id: 'streak_7', title: '7-Day Warrior', description: 'Study 7 days in a row.', icon: <Whatshot />, category: 'Streak', metricTarget: 7, color: 'var(--neon-pink)' },
  { id: 'streak_30', title: '30-Day Legend', description: 'Maintain a 30-day streak.', icon: <Whatshot />, category: 'Streak', metricTarget: 30, color: '#ff0055' },

  // Study
  { id: 'study_100', title: 'Study Master', description: 'Log 100 hours of active studying.', icon: <School />, category: 'Study', metricTarget: 100, color: 'var(--neon-blue)' },
  { id: 'revision_pro', title: 'Revision Pro', description: 'Review past material 10 times.', icon: <AutoGraph />, category: 'Study', metricTarget: 10, color: '#00cc55' }
];

const calculateLevel = (xp) => {
  // Let's assume a formula of XP required for Level N = 100 * (N^1.2)
  // For simplicity here, we'll invert a basic scalar curve or just use fixed tiers
  let lvl = 1;
  let remaining = xp;
  let nextThreshold = 100;

  while (remaining >= nextThreshold) {
    remaining -= nextThreshold;
    lvl++;
    nextThreshold = Math.floor(100 * Math.pow(lvl, 1.2));
  }
  return { level: lvl, currentXP: Math.floor(remaining), nextLevelXP: nextThreshold };
};

const AchievementsGuide = () => {
  const { studentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({ studyTime: 0, streak: 0, totalXP: 0 });
  const [processedBadges, setProcessedBadges] = useState([]);

  useEffect(() => {
    const fetchGamificationData = async () => {
      try {
        setLoading(true);
        const [dashRes, streakRes] = await Promise.all([
           studentAPI.getDashboard(studentId).catch(() => tenthStandardAPI.getDashboard(studentId)),
           streakService.getStreak(studentId).catch(() => ({ streak_count: 0 }))
        ]);

        const totalHours = dashRes?.data?.dashboard_data?.total_study_time || 0;
        const streak = streakRes?.streak_count || 0;
        
        // Calculate abstract total XP
        // +50 XP per study hour + 20XP * streak
        const generatedXP = (totalHours * 50) + (streak * 20);
        
        setUserData({ studyTime: totalHours, streak: streak, totalXP: generatedXP });

        // Calculate progress dynamically against the mock catalog
        const mapped = BADGE_CATALOG.map(b => {
          let currentProg = 0;
          if (b.category === 'Study') currentProg = totalHours;
          if (b.category === 'Streak') currentProg = streak;
          if (b.id === 'first_mock_test') currentProg = 1; // force unlock for demo
          
          if (currentProg > b.metricTarget) currentProg = b.metricTarget;

          const isAchieved = b.isUnlocked || currentProg >= b.metricTarget;
          const pct = Math.floor((currentProg / b.metricTarget) * 100);

          return { ...b, currentProgress: Math.floor(currentProg), isUnlocked: isAchieved, percentage: pct };
        });

        setProcessedBadges(mapped);

      } catch (err) {
        console.error("Failed to load records", err);
        setError("Unable to sync game network connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchGamificationData();
  }, [studentId]);

  if (loading) {
    return <Box sx={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', bgcolor: 'var(--bg-dark)' }}><CircularProgress sx={{ color: 'var(--neon-blue)' }} /></Box>;
  }

  const { level, currentXP, nextLevelXP } = calculateLevel(userData.totalXP);
  const progressPct = (currentXP / nextLevelXP) * 100;
  
  const earnedCount = processedBadges.filter(b => b.isUnlocked).length;
  const totalCount = processedBadges.length;

  // Extract smart feedback
  const getFeedback = () => {
    const closest = processedBadges.filter(b => !b.isUnlocked).sort((a,b) => b.percentage - a.percentage)[0];
    if (closest) {
      if (closest.category === 'Study') return `You're ${closest.percentage}% complete — just ${closest.metricTarget - closest.currentProgress} more hours to earn '${closest.title}'!`;
      if (closest.category === 'Streak') return `You're close to unlocking '${closest.title}' 🔥 Maintain for ${closest.metricTarget - closest.currentProgress} more days!`;
      return `Just ${closest.metricTarget - closest.currentProgress} more to earn '${closest.title}'`;
    }
    return "You have unlocked every available achievement! Phenomenal!";
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--bg-dark)', color: 'white', pt: 4, pb: 10, position: 'relative', overflow: 'hidden' }}>
      
      {/* Background FX */}
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(176,38,255,0.15) 0%, transparent 60%)', filter: 'blur(40px)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: 100, left: 0, width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 60%)', filter: 'blur(50px)', zIndex: 0 }} />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Button startIcon={<ArrowBack />} component={Link} to={`/dashboard`} sx={{ color: 'var(--text-secondary)', mb: 3, '&:hover': { color: 'var(--neon-blue)', background: 'transparent' } }}>
          Return to Dashboard
        </Button>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center' }}>
          <EmojiEvents sx={{ fontSize: 40, color: 'var(--neon-orange)', mr: 2 }} /> 
          Achievement Network
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 5, maxWidth: 600 }}>
          Welcome to your gamified layout. Monitor your XP scaling, track your active streaks, and inspect the global badge catalog to optimize your path forward.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 4, background: 'rgba(255,0,0,0.1)', color: '#ff4444' }}>{error}</Alert>}

        <Grid container spacing={4}>
          
          {/* Header Row: Level Logic */}
          <Grid item xs={12} md={5}>
            <GlassCard>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 1 }}>LIVE TRACKING</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 3 }}>
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'conic-gradient(var(--neon-blue) 0%, var(--neon-purple) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)', mr: 3 }}>
                  <Box sx={{ width: 70, height: 70, borderRadius: '50%', bgcolor: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)', lineHeight: 1 }}>LVL</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1, color: 'white' }}>{level}</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{currentXP} <span style={{fontSize:'0.6em', color:'var(--neon-blue)'}}>XP</span></Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', pt: 0.5 }}>{nextLevelXP} XP</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progressPct} sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, var(--neon-purple) 0%, var(--neon-blue) 100%)', boxShadow: '0 0 10px var(--neon-blue)', borderRadius: 6 } }} />
                  <Typography variant="caption" sx={{ color: 'var(--neon-green)', display: 'block', mt: 1, fontWeight: 500 }}>
                    Only {nextLevelXP - currentXP} XP left to reach Level {level + 1} 🚀
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                <AutoAwesome sx={{ mr: 1, color: 'var(--neon-purple)', fontSize: 18 }} />
                AI Advisor: {getFeedback()}
              </Typography>
            </GlassCard>
          </Grid>

          {/* Header Row: Badge Mastery */}
          <Grid item xs={12} md={7}>
            <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 1, mb: 2 }}>GLOBAL MASTERY</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
                 <Typography variant="h3" sx={{ fontWeight: 900, color: 'white' }}>{Math.floor((earnedCount/totalCount)*100)}%</Typography>
                 <Typography variant="h6" sx={{ color: 'var(--neon-orange)', fontWeight: 700, mb: 0.5 }}>{earnedCount} / {totalCount} Badges</Typography>
              </Box>
              <LinearProgress variant="determinate" value={(earnedCount/totalCount)*100} sx={{ height: 16, borderRadius: 8, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, var(--neon-orange) 0%, #ff0055 100%)', borderRadius: 8 } }} />
            </GlassCard>
          </Grid>

          {/* Master Catalog */}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Earned Badges ✅</Typography>
            <Grid container spacing={3}>
              {processedBadges.filter(b => b.isUnlocked).map(badge => (
                <Grid item xs={12} sm={6} md={4} key={badge.id}>
                  <Box component={motion.div} whileHover={{ translateY: -5 }} className="glass-panel" sx={{ p: 3, borderRadius: 4, height: '100%', borderTop: `2px solid ${badge.color}`, display: 'flex', alignItems: 'flex-start' }}>
                    <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `color-mix(in srgb, ${badge.color} 15%, transparent)`, color: badge.color, mr: 2, boxShadow: `0 0 15px ${badge.color}40` }}>
                      {React.cloneElement(badge.icon, { sx: { fontSize: 32 } })}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>{badge.title}</Typography>
                      <Typography variant="caption" sx={{ color: badge.color, fontWeight: 600, mb: 1, display: 'block' }}>{badge.category}</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{badge.description}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
              {earnedCount === 0 && <Grid item xs={12}><Typography sx={{ color: 'var(--text-secondary)' }}>No badges earned yet. Keep studying!</Typography></Grid>}
            </Grid>
          </Grid>

          <Grid item xs={12} sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: 'var(--text-secondary)' }}>Locked Catalog 🔒</Typography>
            <Grid container spacing={3}>
              {processedBadges.filter(b => !b.isUnlocked).map(badge => (
                <Grid item xs={12} sm={6} md={4} key={badge.id}>
                  <Box className="glass-panel" sx={{ p: 3, borderRadius: 4, height: '100%', bgcolor: 'rgba(255,255,255,0.02)', filter: 'grayscale(0.8) opacity(0.6)', transition: 'all 0.3s', '&:hover': { filter: 'grayscale(0) opacity(1)' }}}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `rgba(255,255,255,0.05)`, color: 'white', mr: 2 }}>
                        <Lock sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>{badge.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>{badge.category}</Typography>
                      </Box>
                    </Box>
                    <Box>
                       <Typography variant="body2" sx={{ color: 'white', mb: 1, fontSize: '0.8rem' }}>{badge.description}</Typography>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: badge.color, fontWeight: 600 }}>{badge.percentage}%</Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{badge.currentProgress} / {badge.metricTarget}</Typography>
                       </Box>
                       <LinearProgress variant="determinate" value={badge.percentage} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { background: badge.color, borderRadius: 3 } }} />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
};

export default AchievementsGuide;
