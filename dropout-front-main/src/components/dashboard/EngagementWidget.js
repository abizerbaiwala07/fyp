import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, LinearProgress, Divider } from '@mui/material';
import { PlayArrow, Pause, Stop, TaskAlt, LockClock, CheckCircle, BugReport } from '@mui/icons-material';
import GlassCard from './GlassCard';

/**
 * EngagementWidget - Provides a daily quest log and a study Pomodoro-style timer.
 */
const EngagementWidget = ({ subjects }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins default
  const [isActive, setIsActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // Create a localized quest log
  const [quests, setQuests] = useState([]);
  const [activeQuestId, setActiveQuestId] = useState(null);

  const subjectStr = subjects && subjects.length > 0 ? subjects[0] : 'Mathematics';

  useEffect(() => {
    // Generate 3 unique quests for the day based on the weakest subject
    const challengePool = [
      { id: 1, text: `Pass 1 practice test module for ${subjectStr}.`, isCompleted: false },
      { id: 2, text: `Maintain a pure focus session for 25 minutes.`, isCompleted: false },
      { id: 3, text: `Review and correct 3 past mistakes in ${subjectStr}.`, isCompleted: false },
      { id: 4, text: `Watch one supplemental video lecture for ${subjectStr}.`, isCompleted: false },
      { id: 5, text: `Create a 1-page summary sheet covering weak topics in ${subjectStr}.`, isCompleted: false }
    ];
    
    // Shuffle and pick top 3
    const shuffled = [...challengePool].sort(() => 0.5 - Math.random());
    setQuests(shuffled.slice(0, 3));
  }, [subjectStr]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(25 * 60); };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkComplete = (questId) => {
    // Enforcement: Allow marking complete only if they ran the timer down, OR if we enable a fast forward check.
    if (timeLeft > 0) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    setQuests(prev => prev.map(q => q.id === questId ? { ...q, isCompleted: true } : q));
    setActiveQuestId(null);
  };

  // DEBUG OVERRIDE for User convenience
  const forceCompleteQuest = (questId) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, isCompleted: true } : q));
    setActiveQuestId(null);
  };

  const completedCount = quests.filter(q => q.isCompleted).length;
  const progressPct = (completedCount / 3) * 100;

  return (
    <GlassCard sx={{ height: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        {/* Header Data */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'var(--neon-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <TaskAlt sx={{ mr: 1, fontSize: 18 }} />
            DAILY QUESTS
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            {completedCount} / 3
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPct} 
          sx={{ mb: 3, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { background: 'var(--neon-green)' } }} 
        />

        {/* Quest List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {quests.map(quest => (
            <Box 
              key={quest.id} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                border: '1px solid',
                borderColor: quest.isCompleted ? 'rgba(0, 204, 85, 0.2)' : activeQuestId === quest.id ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)',
                bgcolor: quest.isCompleted ? 'rgba(0, 204, 85, 0.05)' : activeQuestId === quest.id ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                opacity: quest.isCompleted ? 0.6 : 1,
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  textDecoration: quest.isCompleted ? 'line-through' : 'none',
                  color: quest.isCompleted ? 'var(--text-secondary)' : 'white',
                  mb: quest.isCompleted ? 0 : 1.5,
                  pr: 3 // space for override bug button
                }}
              >
                {quest.text}
              </Typography>
              
              {!quest.isCompleted && (
                <Button 
                  variant={activeQuestId === quest.id ? "contained" : "outlined"} 
                  size="small" 
                  onClick={() => activeQuestId === quest.id ? handleMarkComplete(quest.id) : setActiveQuestId(quest.id)}
                  sx={{ 
                    background: activeQuestId === quest.id ? 'var(--neon-green)' : 'transparent', 
                    color: activeQuestId === quest.id ? 'black' : 'var(--neon-green)',
                    borderColor: 'var(--neon-green)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    '&:hover': { background: activeQuestId === quest.id ? '#00cc55' : 'rgba(0, 204, 85, 0.1)' }
                  }}
                >
                  {activeQuestId === quest.id ? 'Claim Reward' : 'Accept Quest'}
                </Button>
              )}

              {/* Dev Only Override */}
              {!quest.isCompleted && (
                 <IconButton size="small" onClick={() => forceCompleteQuest(quest.id)} sx={{ position: 'absolute', top: 5, right: 5, color: 'rgba(255,255,255,0.2)', '&:hover': { color: 'var(--neon-orange)' } }} title="Dev Only: Auto-Complete Quest">
                    <BugReport fontSize="small" />
                 </IconButton>
              )}

              {quest.isCompleted && (
                 <CheckCircle sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 15, color: 'var(--neon-green)' }} />
              )}
            </Box>
          ))}
        </Box>

        {showWarning && (
           <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'var(--neon-orange)', mt: 1.5, fontWeight: 600, bgcolor: 'rgba(255, 100, 0, 0.1)', p: 1, borderRadius: 1 }}>
              <LockClock sx={{ fontSize: 16, mr: 0.5 }} />
              You must run your Focus Timer down to 00:00 to truly claim this!
           </Typography>
        )}
      </Box>
      
      <Box sx={{ 
        mt: 3, 
        pt: 3, 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>FOCUS SESSION TIMER</Typography>
        <Typography variant="h3" sx={{ fontWeight: 300, fontFamily: 'monospace', my: 1, color: isActive ? 'var(--neon-blue)' : 'white' }}>
          {formatTime(timeLeft)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={toggleTimer} sx={{ color: isActive ? 'var(--neon-pink)' : 'var(--neon-blue)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {isActive ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton onClick={resetTimer} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Stop />
          </IconButton>
        </Box>
      </Box>
    </GlassCard>
  );
};

export default EngagementWidget;
