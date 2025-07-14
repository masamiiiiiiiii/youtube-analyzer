import React from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

const HomePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        YouTube Video Analyzer
      </Typography>
      <Typography variant="body1" gutterBottom>
        Enter the URL of the YouTube interview video you want to analyze.
      </Typography>
      <Box sx={{ display: 'flex', mt: 3 }}>
        <TextField
          fullWidth
          label="YouTube Video URL"
          variant="outlined"
          sx={{ mr: 2 }}
        />
        <Button variant="contained" color="primary" size="large">
          Analyze
        </Button>
      </Box>

      <Paper sx={{ mt: 5, p: 3, display: 'none' }} elevation={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          Analysis Results
        </Typography>
        {/* Analysis results will be displayed here */}
      </Paper>
    </Box>
  );
};

export default HomePage;
