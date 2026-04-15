import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, 
  TextField, Chip, Alert, Tabs, Tab, Divider 
} from '@mui/material';
import { Add, InsertChartOutlined, Insights, Timeline, Close, Category } from '@mui/icons-material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';

/**
 * Custom Tooltip for Recharts mapping the native dark theme.
 */
const DarkNeonTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box className="glass-panel" sx={{ p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'var(--bg-dark)' }}>
        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 0.5 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: payload[0].color || 'var(--neon-green)' }}>
           Score: {payload[0].value}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const PerformanceCharts = ({ data: externalData }) => {
  // Master nested state mapping Subjects -> Array of Score Objects
  const [subjectData, setSubjectData] = useState({
    "Mathematics": [
      { name: "2026-03-01", score: 65 },
      { name: "2026-03-15", score: 72 },
      { name: "2026-04-10", score: 84 }
    ],
    "Physics": [
      { name: "2026-03-05", score: 70 },
      { name: "2026-04-05", score: 68 }
    ],
    "Chemistry": []
  });

  const subjects = Object.keys(subjectData);
  const [activeSubject, setActiveSubject] = useState(subjects[0] || '');
  
  // Modal flows
  const [addScoreModal, setAddScoreModal] = useState(false);
  const [addSubjectModal, setAddSubjectModal] = useState(false);
  const [newScore, setNewScore] = useState({ mark: '', date: new Date().toISOString().split('T')[0] });
  const [newSubject, setNewSubject] = useState('');

  // Protect against empty arrays
  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(activeSubject)) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject]);

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (newSubject.trim() && !subjectData[newSubject]) {
      setSubjectData(prev => ({ ...prev, [newSubject]: [] }));
      setActiveSubject(newSubject);
      setNewSubject('');
      setAddSubjectModal(false);
    }
  };

  const handleAddScore = (e) => {
    e.preventDefault();
    if (activeSubject && newScore.mark) {
      setSubjectData(prev => ({
        ...prev,
        [activeSubject]: [...prev[activeSubject], { name: newScore.date, score: parseInt(newScore.mark) }]
      }));
      setNewScore({ mark: '', date: new Date().toISOString().split('T')[0] });
      setAddScoreModal(false);
    }
  };

  const activeArray = subjectData[activeSubject] || [];
  const hasData = activeArray.length > 0;

  // AI Insights localized to the specific subject tab
  const getSubjectInsights = () => {
     if (activeArray.length < 2) return `Keep adding ${activeSubject} scores to track momentum!`;
     const last = activeArray[activeArray.length - 1];
     const prev = activeArray[activeArray.length - 2];
     const diff = last.score - prev.score;
     
     const avgScore = Math.round(activeArray.reduce((acc, curr) => acc + curr.score, 0) / activeArray.length);

     if (diff > 0) return `Excellent! Your ${activeSubject} performance improved by ${diff}% internally! The historic average is ${avgScore}% 📈`;
     if (diff < 0) return `${activeSubject} performance is declining — analyze your recent mistakes to rebound.`;
     return `${activeSubject} performance is stable at ${avgScore}%. Let's push for a breakout!`;
  };

  return (
    <GlassCard>
      {/* Header Array */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ color: 'var(--neon-green)', mr: 1 }} /> Performance Metrics
        </Typography>
        
        {/* Horizontal Navigation Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 0.5, border: '1px solid rgba(255,255,255,0.05)' }}>
          <Tabs 
            value={activeSubject} 
            onChange={(e, val) => setActiveSubject(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              '& .MuiTabs-indicator': { backgroundColor: 'var(--neon-green)', height: 3, borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': { color: 'var(--text-secondary)', minHeight: 36, py: 0.5, px: 2, fontSize: '0.85rem', fontWeight: 600, textTransform: 'none' },
              '& .Mui-selected': { color: 'white !important', textShadow: '0 0 10px rgba(0, 204, 85, 0.5)' }
            }}
          >
            {subjects.map(sub => (
               <Tab key={sub} value={sub} label={sub} />
            ))}
          </Tabs>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Button onClick={() => setAddSubjectModal(true)} sx={{ minWidth: 'auto', p: 1, color: 'var(--neon-blue)', '&:hover': { background: 'rgba(0, 240, 255, 0.1)' } }} title="Add New Subject">
             <Add fontSize="small" />
          </Button>
        </Box>
      </Box>

      {/* Dynamic Main Body */}
      <AnimatePresence mode="wait">
        {!activeSubject ? (
          <Box key="no-subjects" sx={{ py: 5, textAlign: 'center' }}>
             <Typography sx={{ color: 'var(--text-secondary)' }}>Configure a subject to begin mapping scores.</Typography>
             <Button sx={{ mt: 2, color: 'var(--neon-green)' }} onClick={() => setAddSubjectModal(true)}>+ Define Subject</Button>
          </Box>
        ) : !hasData ? (
          // PER-SUBJECT EMPTY STATE
          <Box 
            key="empty-state"
            component={motion.div}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
          >
            <InsertChartOutlined sx={{ fontSize: 80, color: 'rgba(255,255,255,0.05)', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>No data available for {activeSubject} 📊</Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', maxWidth: 400, mb: 4 }}>
              Start adding your test scores targeting {activeSubject} to compile your historical baseline and trigger AI trend mapping.
            </Typography>

            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setAddScoreModal(true)}
              sx={{ 
                background: 'linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-purple) 100%)', 
                color: 'white', fontWeight: 'bold', px: 4, py: 1.5, borderRadius: 3,
                boxShadow: '0 8px 20px rgba(176, 38, 255, 0.3)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 25px rgba(176, 38, 255, 0.5)' }
              }}
            >
              Add {activeSubject} Performance Data
            </Button>
          </Box>
        ) : (
          // VISUALIZATION CHART ENGINE (FULL WIDTH LINE CHART)
          <Box 
            key="chart-engine"
            component={motion.div}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Alert sx={{ flex: 1, mr: 2, bgcolor: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'white', '& .MuiAlert-icon': { color: 'var(--neon-blue)' } }} icon={<Insights />}>
                 {getSubjectInsights()}
              </Alert>
              <Button 
                startIcon={<Add />} 
                size="small"
                onClick={() => setAddScoreModal(true)}
                sx={{ color: 'var(--neon-green)', borderColor: 'var(--neon-green)', whiteSpace: 'nowrap', '&:hover': { background: 'rgba(0, 204, 85, 0.1)' } }}
                variant="outlined"
              >
                Log Score
              </Button>
            </Box>

            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', mb: 2, display: 'block', fontWeight: 600 }}>LONGITUDINAL TRENDS: {activeSubject.toUpperCase()}</Typography>
            <Box sx={{ height: 350, width: '100%', mt: 2 }}>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={activeArray} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                   <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                   <RechartsTooltip content={<DarkNeonTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                   <Line 
                     type="monotone" 
                     dataKey="score" 
                     stroke="var(--neon-green)" 
                     strokeWidth={3} 
                     dot={{ fill: 'var(--bg-dark)', stroke: 'var(--neon-green)', strokeWidth: 2, r: 5 }} 
                     activeDot={{ r: 7, fill: 'var(--neon-green)', stroke: 'white' }} 
                     animationDuration={1000} 
                   />
                 </LineChart>
               </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </AnimatePresence>

      {/* Add New Subject Modal */}
      <Dialog open={addSubjectModal} onClose={() => setAddSubjectModal(false)} PaperProps={{ style: { backgroundColor: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Define New Subject
          <IconButton onClick={() => setAddSubjectModal(false)} size="small" sx={{ color: 'var(--text-secondary)' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ minWidth: { xs: 300, sm: 400 }, pt: 2 }}>
          <Box component="form" onSubmit={handleAddSubject} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
             <TextField 
                required label="Subject Name" variant="outlined" fullWidth
                value={newSubject} onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Biology" autoFocus
                sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: 'var(--neon-green)' } }, '& .MuiInputLabel-root': { color: 'var(--text-secondary)' } }}
             />
             <Button type="submit" variant="contained" sx={{ mt: 2, py: 1.5, fontWeight: 'bold', background: 'var(--neon-green)', color: 'black', '&:hover': { background: '#00cc55' } }}>
               Create Subject Container
             </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Manual Data Entry Modal */}
      <Dialog open={addScoreModal} onClose={() => setAddScoreModal(false)} PaperProps={{ style: { backgroundColor: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backgroundImage: 'none' } }}>
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Log {activeSubject} Score
          <IconButton onClick={() => setAddScoreModal(false)} size="small" sx={{ color: 'var(--text-secondary)' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ minWidth: { xs: 300, sm: 400 }, pt: 2 }}>
          <Box component="form" onSubmit={handleAddScore} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
             <Chip icon={<Category />} label={`Pre-locked to mapping: ${activeSubject}`} sx={{ bgcolor: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-blue)', '& .MuiChip-icon': { color: 'var(--neon-blue)' }, alignSelf: 'flex-start' }} />
             
             <TextField 
                required label="Mark (%)" type="number" variant="outlined" fullWidth autoFocus
                value={newScore.mark} onChange={(e) => setNewScore({...newScore, mark: e.target.value})}
                placeholder="0 - 100" inputProps={{ min: 0, max: 100 }}
                sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: 'var(--neon-green)' } }, '& .MuiInputLabel-root': { color: 'var(--text-secondary)' } }}
             />
             <TextField 
                required label="Date Achieved" type="date" variant="outlined" fullWidth
                value={newScore.date} onChange={(e) => setNewScore({...newScore, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: 'var(--neon-green)' } }, '& .MuiInputLabel-root': { color: 'var(--text-secondary)' }, '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' } }}
             />
             <Button type="submit" variant="contained" sx={{ mt: 2, py: 1.5, fontWeight: 'bold', background: 'var(--neon-blue)', color: 'white', '&:hover': { background: '#00ccff' } }}>
               Save Trajectory Metric
             </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
};

export default PerformanceCharts;
