import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  TextField, 
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  Close, 
  CloudUpload, 
  Image as ImageIcon, 
  Description as FileIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

const ProofSubmissionModal = ({ open, onClose, quest, onSubmit }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrorMsg(null);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        submissionText: quest.quest_type === 'text' ? submissionText : null,
        file: quest.quest_type !== 'text' ? file : null
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFile(null);
        setPreviewUrl(null);
        setSubmissionText('');
      }, 3000);
    } catch (error) {
      console.error('Submission failed:', error);
      const message = error.response?.data?.detail || 'Submission failed. Please try again.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Submit Quest Proof
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {isSuccess ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'var(--neon-green)', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Proof Submitted!</Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>Verification in progress...</Typography>
          </Box>
        ) : (
          <Box sx={{ py: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              {quest?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {quest?.description}
            </Typography>

            {quest?.quest_type === 'text' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Type your explanation or summary here..."
                value={submissionText}
                onChange={(e) => {
                   setSubmissionText(e.target.value);
                   setErrorMsg(null);
                }}
                error={!!errorMsg && quest.quest_type === 'text'}
                sx={{ mt: 2 }}
              />
            )}

            {(quest?.quest_type === 'image' || quest?.quest_type === 'file') && (
              <Box sx={{ mt: 2 }}>
                <input
                  accept={quest.quest_type === 'image' ? "image/*" : ".pdf,.doc,.docx"}
                  style={{ display: 'none' }}
                  id="proof-file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="proof-file-upload">
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderStyle: 'dashed',
                      borderColor: errorMsg ? 'var(--neon-pink)' : 'rgba(255,255,255,0.2)',
                      '&:hover': { borderColor: 'var(--neon-blue)', bgcolor: 'rgba(33, 150, 243, 0.05)' }
                    }}
                  >
                    <CloudUpload sx={{ fontSize: 40, color: errorMsg ? 'var(--neon-pink)' : 'var(--neon-blue)', mb: 1 }} />
                    <Typography variant="body2">
                      {file ? file.name : `Click or Drag to Upload ${quest.quest_type.toUpperCase()} Proof`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max size: 5MB
                    </Typography>
                  </Paper>
                </label>

                {previewUrl && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                  </Box>
                )}
                
                {!previewUrl && file && (
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <FileIcon color="primary" />
                    <Typography variant="body2">{file.name}</Typography>
                  </Box>
                )}
              </Box>
            )}

            {errorMsg && (
              <Typography variant="caption" sx={{ color: 'var(--neon-pink)', mt: 1, display: 'block', textAlign: 'center', fontWeight: 'bold' }}>
                Verification Failed: {errorMsg}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      {!isSuccess && (
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={isSubmitting || (!file && !submissionText)}
            sx={{ background: 'var(--neon-blue)', fontWeight: 'bold' }}
          >
            {isSubmitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <Typography variant="button">Analyzing...</Typography>
              </Box>
            ) : 'Submit for Verification'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ProofSubmissionModal;
