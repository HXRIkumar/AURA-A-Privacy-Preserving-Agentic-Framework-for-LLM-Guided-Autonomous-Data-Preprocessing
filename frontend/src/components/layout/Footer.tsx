import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' AURA Preprocessor - AI-Powered ML Pipeline'}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Built with React + TypeScript +{' '}
          <Link href="https://mui.com/" target="_blank" rel="noopener">
            Material-UI
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
