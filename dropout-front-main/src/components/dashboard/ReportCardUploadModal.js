import React, { useState, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Box, Typography, Button, 
  IconButton, LinearProgress, TextField, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Divider, Alert, AlertTitle
} from '@mui/material';
import { 
  Close, CloudUpload, Psychology, CheckCircle, Add, 
  Delete, CalendarMonth, Update, Save
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { studentAPI } from '../../services/api';

const ReportCardUploadModal = ({ open, onClose, onRefresh }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Extracting, 3: Verify, 4: Success
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }
      setError(null);
    }
  };

  const startExtraction = async () => {
    if (!file) return;
    
    setStep(2);
    setLoading(true);
    setError(null);

    try {
      const response = await studentAPI.extractReportCard(file);
      setExtractedData(response.data);
      setStep(3);
    } catch (err) {
      console.error("Extraction FAIL:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      
      const detail = err.response?.data?.detail;
      let errorMessage = "AI failed to read the report card. Please try again.";

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // Handle FastAPI validation error list
        errorMessage = detail[0]?.msg || JSON.stringify(detail);
      } else if (detail && typeof detail === 'object') {
        errorMessage = JSON.stringify(detail);
      }

      if (err.response?.status === 401) {
        setError(`Authentication Error: ${errorMessage || 'Session expired. Please log in again.'}`);
      } else {
        setError(errorMessage);
      }
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMark = (index, field, value) => {
    const newData = { ...extractedData };
    if (field === 'score') {
      newData.subjects[index].score = parseInt(value) || 0;
    } else {
      newData.subjects[index].name = value;
    }
    setExtractedData(newData);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await studentAPI.saveReportCard(extractedData);
      setStep(4);
      if (onRefresh) onRefresh();
    } catch (err) {
      setError("Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addSubject = () => {
    setExtractedData({
      ...extractedData,
      subjects: [...extractedData.subjects, { name: "", score: 0 }]
    });
  };

  const removeSubject = (index) => {
    const newData = { ...extractedData };
    newData.subjects.splice(index, 1);
    setExtractedData(newData);
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setFilePreview(null);
    setExtractedData(null);
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? null : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0a0b10',
          backgroundImage: 'radial-gradient(circle at 2% 2%, rgba(0, 240, 255, 0.05) 0%, transparent 40%), radial-gradient(circle at 98% 98%, rgba(176, 38, 255, 0.05) 0%, transparent 40%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Psychology sx={{ color: 'var(--neon-blue)', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>AI Report Insight</Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Automated Performance Extraction</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={loading} sx={{ color: 'var(--text-secondary)' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <Box 
              component={motion.div}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}
            >
              {error && (
                <Alert severity="error" sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ff8a80', border: '1px solid rgba(211, 47, 47, 0.2)' }}>
                  {error}
                </Alert>
              )}

              <Box 
                onClick={() => fileInputRef.current.click()}
                sx={{
                  flex: 1,
                  minHeight: 250,
                  border: '2px dashed rgba(0, 240, 255, 0.2)',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    bgcolor: 'rgba(0, 240, 255, 0.03)',
                    borderColor: 'var(--neon-blue)',
                    boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.1)'
                  }
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept=".pdf,image/*" 
                  onChange={handleFileSelect} 
                />
                
                {filePreview ? (
                  <Box sx={{ position: 'relative', width: '100%', height: '100%', p: 2, display: 'flex', justifyContent: 'center' }}>
                    <img src={filePreview} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                    <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center' }}>
                       <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.7)', px: 2, py: 0.5, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                         {file.name} ({(file.size / 1024).toFixed(1)} KB)
                       </Typography>
                    </Box>
                  </Box>
                ) : file ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 60, color: 'var(--neon-blue)', mb: 2 }} />
                    <Typography>{file.name}</Typography>
                    <Typography variant="caption" color="var(--text-secondary)">PDF Document Detected</Typography>
                  </Box>
                ) : (
                  <>
                    <Box className="pulse-slow" sx={{ bgcolor: 'rgba(0, 240, 255, 0.1)', p: 3, borderRadius: '50%', mb: 2 }}>
                       <CloudUpload sx={{ fontSize: 40, color: 'var(--neon-blue)' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>Drag or click to upload</Typography>
                    <Typography variant="body2" color="var(--text-secondary)">Supports PDF, JPG, PNG (Max 5MB)</Typography>
                  </>
                )}
              </Box>

              <Button 
                variant="contained" 
                fullWidth 
                disabled={!file}
                onClick={startExtraction}
                sx={{ 
                  py: 1.5, borderRadius: 3, fontWeight: 'bold', fontSize: '1rem',
                  background: 'linear-gradient(90deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
                  '&:disabled': { opacity: 0.5, background: 'rgba(255,255,255,0.05)' }
                }}
              >
                Analyze Report with Gemini
              </Button>
            </Box>
          )}

          {/* STEP 2: SCANNING */}
          {step === 2 && (
            <Box 
              component={motion.div}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}
            >
              <Box sx={{ position: 'relative', mb: 4 }}>
                 <Box sx={{
                    width: 120, height: 120, borderRadius: '50%',
                    border: '2px solid rgba(0, 240, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'spin 4s linear infinite'
                 }}>
                    <Update sx={{ fontSize: 60, color: 'var(--neon-blue)' }} />
                 </Box>
                 <Box sx={{
                    position: 'absolute', top: -5, left: -5, right: -5, bottom: -5,
                    borderRadius: '50%', border: '4px solid transparent',
                    borderTopColor: 'var(--neon-purple)', animation: 'spin 2s linear infinite'
                 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} gutterBottom sx={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.3)' }}>AI Scanning in Progress...</Typography>
              <Typography color="var(--text-secondary)" sx={{ textAlign: 'center', maxWidth: 350 }}>
                Gemini is extracting subject data and identifying trends from your document.
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 400, mt: 4 }}>
                <LinearProgress sx={{ 
                  height: 6, borderRadius: 3, 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-purple))' }
                }} />
              </Box>
            </Box>
          )}

          {/* STEP 3: VERIFY */}
          {step === 3 && (
            <Box 
              component={motion.div}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <CalendarMonth sx={{ color: 'var(--neon-purple)', fontSize: 20 }} />
                   <TextField 
                      label="Verification Date" 
                      type="date"
                      value={extractedData.date}
                      onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                      size="small"
                      variant="standard"
                      sx={{ '& input': { color: 'white', fontSize: '0.9rem' }, '& label': { color: 'var(--text-secondary)' } }}
                      InputLabelProps={{ shrink: true }}
                   />
                </Box>
                <Chip icon={<Add />} label="Add Subject" size="small" onClick={addSubject} sx={{ bgcolor: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-blue)', cursor: 'pointer' }} />
              </Box>

              <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { color: 'var(--text-secondary)', fontWeight: 800, borderBottom: '1px solid rgba(255,255,255,0.1)' } }}>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Mark (%)</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {extractedData.subjects.map((row, idx) => (
                      <TableRow key={idx} sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.03)' } }}>
                        <TableCell sx={{ color: 'white' }}>
                          <TextField 
                            variant="standard" fullWidth value={row.name} 
                            onChange={(e) => handleEditMark(idx, 'name', e.target.value)}
                            sx={{ '& input': { color: 'white' } }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <TextField 
                            variant="standard" type="number" 
                            sx={{ width: 80, '& input': { color: 'var(--neon-green)', textAlign: 'center', fontWeight: 'bold' } }}
                            value={row.score} 
                            onChange={(e) => handleEditMark(idx, 'score', e.target.value)}
                            inputProps={{ min: 0, max: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => removeSubject(idx)} sx={{ color: '#ff5252' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                <Button fullWidth variant="outlined" onClick={() => setStep(1)} sx={{ color: 'var(--text-secondary)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  Retry Upload
                </Button>
                <Button 
                  fullWidth variant="contained" 
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={loading}
                  sx={{ background: 'var(--neon-green)', color: 'black', fontWeight: 800 }}
                >
                  Confirm & Sync
                </Button>
              </Box>
            </Box>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <Box 
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 4 }}
            >
              <CheckCircle sx={{ fontSize: 80, color: 'var(--neon-green)', mb: 2 }} />
              <Typography variant="h5" fontWeight={800} gutterBottom>Sync Successful!</Typography>
              <Typography color="var(--text-secondary)" sx={{ mb: 4 }}>
                Your performance metrics have been extracted and integrated into your trajectory charts.
              </Typography>
              <Button variant="outlined" onClick={onClose} sx={{ color: 'var(--neon-green)', borderColor: 'var(--neon-green)', minWidth: 200 }}>
                 Back to Dashboard
              </Button>
            </Box>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportCardUploadModal;
