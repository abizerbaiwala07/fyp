import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

/**
 * A reusable glassmorphism card component with neon hover effects.
 * Wraps children in a styled container.
 */
const GlassCard = ({ children, sx = {}, hover = true, delay = 0, className = '' }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${className}`}
      sx={{
        borderRadius: '16px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        ...sx
      }}
    >
      {/* Subtle background glow effect if active */}
      <Box
        sx={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
};

export default GlassCard;
