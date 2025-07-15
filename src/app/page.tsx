'use client';
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';

const HomePage: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisResult(JSON.stringify(data, null, 2)); // Display raw JSON for now
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

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
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          disabled={loading}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAnalyze}
          disabled={loading || !youtubeUrl}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {analysisResult && (
        <Paper sx={{ mt: 5, p: 3 }} elevation={3}>
          <Typography variant="h5" component="h2" gutterBottom>
            Analysis Results
          </Typography>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {analysisResult}
          </pre>
        </Paper>
      )}
    </Box>
  );
};

export default HomePage;