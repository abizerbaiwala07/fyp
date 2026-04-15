import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, LinearProgress, Tooltip, CircularProgress } from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Stop, 
  TaskAlt, 
  CheckCircle, 
  Image as ImageIcon, 
  Description as FileIcon, 
  Chat as TextIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import GlassCard from './GlassCard';
import questService from '../../services/questService';
import ProofSubmissionModal from './ProofSubmissionModal';
import { useGamification } from '../../contexts/GamificationContext';

/**
 * EngagementWidget - Provides a daily quest log with proof submission and a study timer.
 */
const EngagementWidget = ({ subjects }) => {
  const { 
    studentData, 
    refreshStudentData, 
    activeQuest, 
    timeLeft, 
    startQuestTimer, 
    stopQuestTimer 
  } = useGamification();
  
  const studentId = studentData?.student_id;
  
  const [quests, setQuests] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchQuests();
    }
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuests = async () => {
    if (!studentId) return;
    try {
      setLoadingQuests(true);
      const response = await questService.getDailyQuests(studentId);
      setQuests(response.data);
    } catch (error) {
      console.error('EngagementWidget: Error fetching quests:', error);
    } finally {
      setLoadingQuests(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenSubmission = (quest) => {
    setSelectedQuest(quest);
    setIsModalOpen(true);
  };

  const handleSubmitProof = async (submissionData) => {
    try {
      const questId = selectedQuest._id || selectedQuest.id;
      if (!questId) return;
      
      await questService.submitProof(questId, studentId, submissionData);
      
      // If the timer was running for this specific quest, stop it
      if (activeQuest?.id === questId) {
        await stopQuestTimer(true);
      }

      await Promise.all([
        fetchQuests(),
        refreshStudentData()
      ]);
      
    } catch (error) {
      console.error('Failed to submit proof:', error);
      throw error;
    }
  };

  const handleStartQuest = (quest) => {
    // Determine expected duration - default 1 hour if not specified in quest
    const duration = 60; // Minutes
    startQuestTimer(quest._id || quest.id, quest.title, duration);
  };

  const getQuestIcon = (type) => {
    switch(type) {
      case 'image': return <ImageIcon sx={{ fontSize: 16 }} />;
      case 'file': return <FileIcon sx={{ fontSize: 16 }} />;
      case 'text': return <TextIcon sx={{ fontSize: 16 }} />;
      default: return <TaskAlt sx={{ fontSize: 16 }} />;
    }
  };

  const completedCount = quests.filter(q => q.status === 'completed').length;
  const progressPct = quests.length > 0 ? (completedCount / quests.length) * 100 : 0;

  // Active Quest Progress
  const activeQuestProgress = activeQuest ? (1 - (timeLeft / (activeQuest.duration * 60))) * 100 : 0;

  return (
    <GlassCard sx={{ height: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        {/* Header Data */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'var(--neon-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <TrophyIcon sx={{ mr: 1, fontSize: 18 }} />
            DAILY QUESTS
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            {completedCount} / {quests.length}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progressPct} 
          sx={{ mb: 3, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { background: 'var(--neon-green)' } }} 
        />

        {/* Quest List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loadingQuests ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
          ) : quests.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No quests available for today.
              </Typography>
              <Button size="small" variant="text" onClick={fetchQuests} sx={{ mt: 1, fontSize: '0.7rem' }}>
                Retry
              </Button>
            </Box>
          ) : (
            quests.map(quest => {
              const isQuestActive = activeQuest?.id === (quest._id || quest.id);
              const isCompleted = quest.status === 'completed';

              return (
                <Box 
                  key={quest._id || quest.id} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: isQuestActive ? 'var(--neon-blue)' : isCompleted ? 'rgba(0, 204, 85, 0.2)' : 'rgba(255,255,255,0.1)',
                    bgcolor: isQuestActive ? 'rgba(0, 240, 255, 0.05)' : isCompleted ? 'rgba(0, 204, 85, 0.05)' : 'transparent',
                    boxShadow: isQuestActive ? '0 0 15px rgba(0, 240, 255, 0.1)' : 'none',
                    opacity: isCompleted ? 0.7 : 1,
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isQuestActive && (
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 2, background: 'rgba(255,255,255,0.1)' }}>
                      <Box sx={{ width: `${activeQuestProgress}%`, height: '100%', background: 'var(--neon-blue)', transition: 'width 1s linear' }} />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: isCompleted ? 'var(--text-secondary)' : 'white',
                        textDecoration: isCompleted ? 'line-through' : 'none'
                      }}
                    >
                      {quest.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'var(--neon-blue)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>+{quest.xp_reward} XP</Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 2 }}>
                    {quest.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'var(--text-secondary)' }}>
                      {getQuestIcon(quest.quest_type)}
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{quest.quest_type} proof</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isCompleted ? (
                        <CheckCircle sx={{ color: 'var(--neon-green)', fontSize: 20 }} />
                      ) : isQuestActive ? (
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => handleOpenSubmission(quest)}
                          sx={{ 
                            background: 'var(--neon-green)',
                            color: 'black',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            '&:hover': { background: '#00cc55' }
                          }}
                        >
                          Complete
                        </Button>
                      ) : activeQuest ? (
                        <Button variant="outlined" disabled size="small" sx={{ fontSize: '0.65rem' }}>
                          Wait...
                        </Button>
                      ) : (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleStartQuest(quest)}
                          sx={{ 
                            color: 'var(--neon-blue)',
                            borderColor: 'var(--neon-blue)',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            '&:hover': { background: 'rgba(0, 240, 255, 0.1)', borderColor: 'var(--neon-blue)' }
                          }}
                        >
                          Start Quest
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
      
      {/* Active Quest Timer Overlay */}
      {activeQuest && (
        <Box sx={{ 
          mt: 3, 
          pt: 3, 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <Typography variant="caption" sx={{ color: 'var(--neon-blue)', fontWeight: 'bold', letterSpacing: 1.5 }}>
            QUEST IN PROGRESS ⏱
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5, fontWeight: 500 }}>
            {activeQuest.title}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 300, fontFamily: 'monospace', my: 1, color: 'white', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
            {formatTime(timeLeft)}
          </Typography>
          
          <Button 
            variant="text" 
            size="small" 
            onClick={() => stopQuestTimer(false)}
            sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', mt: 1 }}
          >
            Cancel Session
          </Button>
        </Box>
      )}

      <ProofSubmissionModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        quest={selectedQuest} 
        onSubmit={handleSubmitProof} 
      />
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }
      `}</style>
    </GlassCard>
  );
};

export default EngagementWidget;
