'use client';
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
// AWS SDK関連のインポートは不要になるため削除
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

  // S3Clientの初期化は不要になるため削除
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
      const response = await fetch('https://video-analyzer-service-256206482530.asia-southeast2.run.app/api/analyze-youtube', { // Cloud Run URLに直接変更
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

    try {
      // バックエンドから署名付きURLを取得
      const getSignedUrlResponse = await fetch('https://video-analyzer-service-256206482530.asia-southeast2.run.app/api/get-gcs-signed-url', { // Cloud Run URLに直接変更
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: selectedFile.name, contentType: selectedFile.type }),
      });

      if (!getSignedUrlResponse.ok) {
        const errorData = await getSignedUrlResponse.json();
        throw new Error(errorData.detail || 'Failed to get signed URL');
      }

      const { signedUrl, gcsFileUrl } = await getSignedUrlResponse.json();

      // 署名付きURLを使ってGCSに直接アップロード
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to GCS: ${uploadResponse.statusText}`);
      }

      // GCSへのアップロードが完了したら、バックエンドにGCSのURLを通知
      const analyzeResponse = await fetch('https://video-analyzer-service-256206482530.asia-southeast2.run.app/api/analyze-gcs', { // Cloud Run URLに直接変更
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gcsUrl: gcsFileUrl }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.detail || 'Analysis failed after GCS upload');
      }

      const resultData = await analyzeResponse.json();
      setAnalysisResult(JSON.stringify(resultData, null, 2));

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during GCS upload or analysis.');
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
