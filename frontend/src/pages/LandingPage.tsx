import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AutoAwesome as AutoIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { uploadDataset } from '../api/endpoints';
import { usePipeline } from '../context/PipelineContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setDatasetId } = usePipeline();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await uploadDataset(file);
      setDatasetId(response.dataset_id);
      navigate('/dataset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload file. Please ensure the backend is running.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          AURA Preprocessor
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          AI-Powered Machine Learning Pipeline
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Upload your dataset and let AI guide you through preprocessing and model training
        </Typography>
      </Box>

      {/* Upload Section */}
      <Card sx={{ mb: 4 }} elevation={2}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              mb: 2,
            }}
          >
            <UploadIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Upload Your Dataset
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Upload a CSV file to start preprocessing and analysis
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              size="large"
              startIcon={<UploadIcon />}
            >
              Choose CSV File
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Box sx={{ width: '100%', maxWidth: 500 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <FileIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Box sx={{ flex: 1, textAlign: 'left' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(file.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                </Paper>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleUpload}
                  disabled={uploading}
                  sx={{ py: 1.5 }}
                >
                  {uploading ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      <span>Uploading...</span>
                    </Box>
                  ) : (
                    'Upload and Continue'
                  )}
                </Button>
                {uploading && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress />
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <Typography variant="h5" textAlign="center" mb={3} fontWeight={600}>
        Features
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mb: 2,
                }}
              >
                <AutoIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                AI-Powered Auto Mode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Let our LLM analyze your dataset and recommend the best preprocessing strategies
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  mb: 2,
                }}
              >
                <TimelineIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Step-by-Step Pipeline
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manual mode for full control over missing values, encoding, scaling, and model training
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }} elevation={2}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                  mb: 2,
                }}
              >
                <AssessmentIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Detailed Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get comprehensive reports with metrics, visualizations, and downloadable results
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LandingPage;