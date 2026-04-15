import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Grid,
  Chip,
  Avatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  RestartAlt,
  Home,
  MenuBook,
  AutoAwesome,
  Celebration,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

const QuizResultScreen = ({ 
  results, 
  onRestart, 
  onGoHome,
  score,
  totalQuestions,
  difficulty,
  quizData = [],
  userAnswers = {}
}) => {
  const [xpProgress, setXpProgress] = useState(0);
  const [showBadges, setShowBadges] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Animate XP bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setXpProgress(results.progress_pct || 0);
      setShowBadges(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [results.progress_pct]);

  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header / Celebration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        <Paper
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            mb: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Background Highlight */}
          <Box sx={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(33, 150, 243, 0.05) 0%, transparent 70%)',
            zIndex: 0
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Celebration sx={{ fontSize: 60, color: 'gold', mb: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
              {percentage}%
            </Typography>
            <Typography variant="h5" color="textSecondary" gutterBottom>
              {score} / {totalQuestions} Questions Correct
            </Typography>
            <Chip 
              label={difficulty} 
              color="primary" 
              variant="outlined" 
              size="small" 
              sx={{ mt: 1, fontWeight: 'bold' }} 
            />
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Progress & Persistence */}
        <Grid item xs={12} md={7}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Paper sx={{ p: 4, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.03)', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" /> Progress Update
              </Typography>
              
              <Box sx={{ mt: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Level {results.new_level}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--neon-blue)' }}>
                    +{results.xp_gained} XP
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={xpProgress} 
                  sx={{ 
                    height: 12, 
                    borderRadius: 6,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #2196f3, #9c27b0)',
                      borderRadius: 6
                    }
                  }} 
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {results.xp_in_level} / 100 XP to Level {results.new_level + 1}
                </Typography>
              </Box>

              {results.bonuses && results.bonuses.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom color="textSecondary">Bonuses Earned:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {results.bonuses.map((bonus, idx) => (
                      <Chip 
                        key={idx} 
                        label={`${bonus.label} (+${bonus.xp} XP)`} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                        sx={{ borderColor: 'rgba(156, 39, 176, 0.5)' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Grid>

        {/* AI Insight */}
        <Grid item xs={12} md={5}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Paper sx={{ p: 4, borderRadius: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderLeft: '4px solid var(--neon-blue)', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome sx={{ color: 'var(--neon-blue)' }} /> AI Feedback
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: 'italic', lineHeight: 1.6, mt: 2 }}>
                "{results.ai_feedback}"
              </Typography>
            </Paper>
          </motion.div>
        </Grid>

        {/* Badges Earned */}
        <AnimatePresence>
          {showBadges && results.new_badges && results.new_badges.length > 0 && (
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="h6" gutterBottom>New Achievements Unlocked!</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                    {results.new_badges.map((badge, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.1 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.2 }}
                      >
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: '50%', 
                          background: 'rgba(255,215,0,0.1)', 
                          border: '2px solid rgba(255,215,0,0.3)',
                          width: 80,
                          height: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          margin: '0 auto'
                        }}>
                          {badge.icon || '🏆'}
                        </Box>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                          {badge.title}
                        </Typography>
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          )}
        </AnimatePresence>
      </Grid>

      {/* Review Section Toggle */}
      <Box sx={{ mt: 6 }}>
        <Divider sx={{ mb: 4 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button 
            variant="text" 
            onClick={() => setShowReview(!showReview)}
            endIcon={<ExpandMoreIcon sx={{ transform: showReview ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />}
            sx={{ color: 'var(--text-secondary)' }}
          >
            {showReview ? 'Hide Review' : 'Review Your Answers'}
          </Button>
        </Box>

        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {quizData.map((q, idx) => {
                  const isCorrect = q.type === 'short_answer' ? true : userAnswers[q.id] === q.correctIndex;
                  return (
                    <Accordion 
                      key={q.id} 
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                        backgroundImage: 'none',
                        borderRadius: '12px !important',
                        '&:before': { display: 'none' },
                        mb: 1
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {isCorrect ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                          <Typography sx={{ fontWeight: 600 }}>
                            {idx + 1}. {q.question.substring(0, 60)}...
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 2, px: 3 }}>
                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>{q.question}</Typography>
                        
                        {q.type !== 'short_answer' && (
                          <Box sx={{ mb: 2, ml: 1 }}>
                            <Typography variant="body2" color={isCorrect ? 'success.main' : 'error.main'} sx={{ mb: 0.5 }}>
                              Your Answer: {q.options[userAnswers[q.id]] || 'Not answered'}
                            </Typography>
                            {!isCorrect && (
                              <Typography variant="body2" color="success.main">
                                Correct Answer: {q.options[q.correctIndex]}
                              </Typography>
                            )}
                          </Box>
                        )}

                        {q.type === 'short_answer' && (
                          <Box sx={{ mb: 2, ml: 1 }}>
                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mb: 0.5 }}>
                              Your Input: {userAnswers[q.id] || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              Expected: {q.correctAnswer}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ 
                          p: 2, 
                          backgroundColor: 'rgba(33, 150, 243, 0.08)', 
                          borderRadius: 2,
                          borderLeft: '4px solid #2196f3'
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#2196f3', display: 'block', mb: 0.5 }}>
                            Educational Insight
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {q.explanation}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          size="large" 
          startIcon={<RestartAlt />} 
          onClick={onRestart}
          sx={{ borderRadius: 3, px: 4 }}
        >
          Try Another
        </Button>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<Home />} 
          onClick={onGoHome}
          sx={{ 
            borderRadius: 3, 
            px: 4,
            background: 'linear-gradient(90deg, #2196f3, #9c27b0)',
            '&:hover': {
              background: 'linear-gradient(90deg, #1e88e5, #8e24aa)',
            }
          }}
        >
          Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default QuizResultScreen;
