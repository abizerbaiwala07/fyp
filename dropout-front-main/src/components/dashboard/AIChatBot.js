import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton } from '@mui/material';
import { Psychology, Refresh, AutoAwesome, Check, Close } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';

/**
 * AIChatBot - A conversational style interface for the AI Academic Advisor.
 * Simulates a ChatGPT-like typing experience for the AI reports.
 */
const AIChatBot = ({ report, isGenerating, onRegenerate }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typing effect logic
  useEffect(() => {
    if (!report || isGenerating) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    let i = 0;
    setDisplayedText('');
    
    // Convert markdown specific formatting immediately, but type the text
    const typingInterval = setInterval(() => {
      setDisplayedText((prev) => prev + report.charAt(i));
      i++;
      if (i >= report.length) {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15); // Speed of typing

    return () => clearInterval(typingInterval);
  }, [report, isGenerating]);

  // Custom components for Markdown to add colored tags for Strengths/Weaknesses
  const MarkdownComponents = {
    li: ({ node, ...props }) => {
      // Check if it's a weak/strong tag point
      const text = String(props.children);
      if (text.includes('Weak') || text.includes('Improvement')) {
        return (
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start' }}>
            <Close sx={{ color: 'var(--status-danger)', fontSize: 16, mr: 1, mt: 0.5 }} />
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{props.children}</span>
          </li>
        );
      }
      if (text.includes('Strong') || text.includes('Strength') || text.includes('Excellent')) {
        return (
          <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start' }}>
            <Check sx={{ color: 'var(--status-good)', fontSize: 16, mr: 1, mt: 0.5 }} />
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{props.children}</span>
          </li>
        );
      }
      return <li style={{ marginBottom: '8px' }} {...props} />;
    },
    h3: ({ node, ...props }) => (
      <Typography variant="h6" sx={{ color: 'var(--neon-blue)', mt: 3, mb: 1, fontWeight: 'bold' }} {...props} />
    ),
    h4: ({ node, ...props }) => (
      <Typography variant="subtitle1" sx={{ color: 'var(--neon-purple)', mt: 2, mb: 1 }} {...props} />
    ),
    p: ({ node, ...props }) => (
      <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, color: 'var(--text-secondary)' }} {...props} />
    ),
    strong: ({ node, ...props }) => (
      <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }} {...props} />
    )
  };

  return (
    <GlassCard sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 400 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            backgroundColor: 'rgba(176, 38, 255, 0.2)', 
            p: 1, 
            borderRadius: '50%', 
            mr: 2,
            display: 'flex',
            boxShadow: '0 0 10px rgba(176, 38, 255, 0.4)'
          }}>
            <AutoAwesome sx={{ color: 'var(--neon-purple)' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>AI Academic Advisor</Typography>
        </Box>
        
        <Button 
          variant="outlined" 
          size="small"
          onClick={onRegenerate}
          disabled={isGenerating || isTyping}
          startIcon={isGenerating ? <CircularProgress size={16} /> : <Refresh />}
          sx={{ 
            color: 'var(--neon-blue)', 
            borderColor: 'var(--neon-blue)',
            '&:hover': {
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
              borderColor: 'var(--neon-blue)'
            }
          }}
        >
          {isGenerating ? 'Analyzing...' : 'Regenerate Strategy'}
        </Button>
      </Box>

      {/* Chat Area */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        pr: 1,
        // Custom scrollbar for Chat Area
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
      }}>
        <AnimatePresence mode="wait">
          {(!report && !isGenerating) ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}
            >
              <Psychology sx={{ fontSize: 64, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
              <Typography>Click 'Regenerate Strategy' to get your AI-powered study plan.</Typography>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--neon-blue)' }}
            >
              <CircularProgress color="inherit" size={40} sx={{ mb: 2 }} />
              <Typography className="pulsate">AI is analyzing your profile...</Typography>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ paddingBottom: '20px' }}
            >
              <Box sx={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                borderRadius: '12px', 
                p: 3, 
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <ReactMarkdown components={MarkdownComponents}>
                  {displayedText}
                </ReactMarkdown>
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    style={{ 
                      display: 'inline-block', 
                      width: '6px', 
                      height: '16px', 
                      backgroundColor: 'var(--neon-blue)', 
                      marginLeft: '4px',
                      verticalAlign: 'middle'
                    }}
                  />
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </GlassCard>
  );
};

export default AIChatBot;
