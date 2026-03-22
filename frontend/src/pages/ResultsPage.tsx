import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { getResults, downloadProcessedData, downloadReport, downloadExplanations } from '../api/endpoints';
import { usePipeline } from '../context/PipelineContext';
import type { PipelineResults } from '../types/api';

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { pipelineId, reset } = usePipeline();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PipelineResults | null>(null);

  useEffect(() => {
    if (!pipelineId) {
      navigate('/');
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getResults(pipelineId);
        setResults(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load results');
        console.error('Results load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [pipelineId, navigate]);

  const handleDownload = async (type: 'processed' | 'report' | 'explanations') => {
    if (!pipelineId) return;

    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'processed':
          blob = await downloadProcessedData(pipelineId);
          filename = 'processed_data.csv';
          break;
        case 'report':
          blob = await downloadReport(pipelineId);
          filename = 'report.json';
          break;
        case 'explanations':
          blob = await downloadExplanations(pipelineId);
          filename = 'explanations.json';
          break;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const handleNewPipeline = () => {
    reset();
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography variant="h6" mt={2} fontWeight={600}>
            Loading Results
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Fetching your pipeline results...
          </Typography>
        </Card>
      </Container>
    );
  }

  if (error || !results) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Failed to load results'}
        </Alert>
        <Button
          variant="contained"
          onClick={handleNewPipeline}
          size="large"
          fullWidth
        >
          Start New Pipeline
        </Button>
      </Container>
    );
  }

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.map(v => `• ${v}`).join('\n');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Success Header */}
      <Box textAlign="center" mb={4}>
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
          <CheckIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Pipeline Completed Successfully
        </Typography>
        <Chip
          label={`Execution time: ${results.execution_time?.toFixed(2)}s`}
          color="primary"
          sx={{ fontWeight: 500 }}
        />
      </Box>

      {/* Model Metrics */}
      <Card sx={{ mb: 3 }} elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <AssessmentIcon sx={{ fontSize: 28, mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Model Performance
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    Accuracy
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {((results.model_metrics.accuracy || 0) * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    CV Score
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {((results.model_metrics.cv_score || 0) * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    CV Std Dev
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {((results.model_metrics.cv_std || 0) * 100).toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Preprocessing Summary */}
      {results.preprocessing_summary && (
        <Card sx={{ mb: 3 }} elevation={2}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} mb={2}>
              Preprocessing Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Object.entries(results.preprocessing_summary).map(([key, value]) => (
                <Grid item xs={12} md={6} key={key}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="primary.main"
                      fontWeight={600}
                      gutterBottom
                    >
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: Array.isArray(value) ? 'inherit' : 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        color: 'text.primary',
                      }}
                    >
                      {formatValue(value)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Downloads */}
      <Card sx={{ mb: 3 }} elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <DownloadIcon sx={{ fontSize: 28, mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Download Results
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('processed')}
                fullWidth
              >
                Processed Data (CSV)
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('report')}
                fullWidth
              >
                Report (JSON)
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload('explanations')}
                fullWidth
              >
                Explanations (JSON)
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box textAlign="center">
        <Button
          variant="contained"
          size="large"
          onClick={handleNewPipeline}
          sx={{ px: 4, py: 1.5 }}
        >
          Start New Pipeline
        </Button>
      </Box>
    </Container>
  );
};

export default ResultsPage;