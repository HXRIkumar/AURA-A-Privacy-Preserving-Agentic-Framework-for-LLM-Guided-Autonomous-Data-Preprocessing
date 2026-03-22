import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AutoAwesome as AutoIcon } from '@mui/icons-material';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <AutoIcon sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          AURA Preprocessor
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" onClick={() => navigate('/')}>
            Home
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
