'use client';
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
// S3関連のインポートはコメントアウトまたは削除
// import { S3Client, CompleteMultipartUploadCommandOutput } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";

const HomePage: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0); // 0 for URL, 1 for File Upload
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // S3Clientの初期化はコメントアウトまたは削除
  // const s3Client = new S3Client({
  //   region: process.env.NEXT_PUBLIC_AWS_REGION,
  //   credentials: {
  //     accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
  //     secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  //   },
  // });

  const handleAnalyzeURL = async () => {
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
      setAnalysisResult(JSON.stringify(data, null, 2));
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

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setUploadProgress(0);

    // S3関連のコードをコメントアウトまたは削除
    // const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    // if (!bucketName) {
    //   setError('S3 bucket name is not configured.');
    //   setLoading(false);
    //   return;
    // }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // ローカルのFastAPIバックエンドに直接アップロード
      const response = await fetch('http://localhost:8000/api/uploadfile/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'File upload failed');
      }

      const data = await response.json();
      setAnalysisResult(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during file upload.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setAnalysisResult(null);
    setYoutubeUrl('');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Video Analyzer
      </Typography>
      <Typography variant="body1" gutterBottom>
        Analyze YouTube videos or upload your own video files.
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mt: 3 }}>
        <Tab label="Analyze by YouTube URL" />
        <Tab label="Upload Video File" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tabValue === 0 && (
          <Box sx={{ display: 'flex' }}>
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
              onClick={handleAnalyzeURL}
              disabled={loading || !youtubeUrl}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <input
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              id="video-upload-button"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
            />
            <label htmlFor="video-upload-button">
              <Button variant="contained" component="span">
                {selectedFile ? selectedFile.name : 'Choose Video File'}
              </Button>
            </label>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleFileUpload}
              disabled={loading || !selectedFile}
              sx={{ ml: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Upload & Analyze'}
            </Button>
            {loading && uploadProgress > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Uploading: {uploadProgress}%
              </Typography>
            )}
          </Box>
        )}
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
