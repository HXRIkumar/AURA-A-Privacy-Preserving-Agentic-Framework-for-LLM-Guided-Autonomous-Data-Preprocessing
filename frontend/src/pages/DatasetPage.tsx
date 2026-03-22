import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  AutoAwesome as AutoIcon,
  Build as ManualIcon,
  TableChart as TableIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { getDatasetInfo, previewDataset } from '../api/endpoints';
import { usePipeline } from '../context/PipelineContext';
import { useChat } from '../context/ChatContext';
import type { DatasetInfo, DatasetPreview } from '../types/api';

const DatasetPage: React.FC = () => {
  const navigate = useNavigate();
  const { datasetId, updateConfig, setDatasetInfo } = usePipeline();
  const { setDatasetContext } = useChat();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<DatasetInfo | null>(null);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);

  // Configuration state
  const [mode, setMode] = useState<'auto' | 'step'>('auto');
  const [saveOptions, setSaveOptions] = useState({
    processed_data: true,
    report: true,
    explanations: true,
  });

  useEffect(() => {
    if (!datasetId) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [infoData, previewData] = await Promise.all([
          getDatasetInfo(datasetId),
          previewDataset(datasetId, 10),
        ]);
        setInfo(infoData);
        setPreview(previewData);

        // Set dataset info in pipeline context
        setDatasetInfo(infoData);

        // Set dataset context for LLM
        setDatasetContext(datasetId, {
          dataset_id: datasetId,
          dataset_name: infoData.filename,
          columns: infoData.columns.map((col) => ({
            name: col,
            type: infoData.numeric_columns.includes(col) ? 'numeric' : 'categorical',
            missing_pct: (previewData.missing_values[col] || 0) / infoData.shape[0] * 100,
            nunique: 0, // Backend should provide this
          })),
          shape: infoData.shape,
          sample_rows: previewData.data.slice(0, 5),
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dataset. Please ensure the backend is running.');
        console.error('Dataset load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datasetId, navigate, setDatasetContext]);

  const handleContinue = () => {
    const config: any = {
      mode,
      save_options: saveOptions,
    };

    updateConfig(config);
    
    // Navigate to wizard for Manual Mode, or directly to pipeline for Auto Mode
    if (mode === 'step') {
      navigate('/wizard/missing-values');
    } else {
      navigate('/pipeline');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
<Card sx={{ p: 4, textAlign: 'center', minWidth: 300 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" mt={3} fontWeight={600}>
              Loading Dataset
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Analyzing your data...
            </Typography>
          </Card>
</Box>
    );
  }

  if (error || !info || !preview) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
<Box>
            <Alert severity="error" sx={{ mb: 3, fontSize: '1rem' }}>
              {error || 'Failed to load dataset'}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              size="large"
              fullWidth
            >
              Back to Home
            </Button>
          </Box>
</Container>
    );
  }

  const missingCount = Object.values(info.missing_values).reduce((a, b) => a + b, 0);

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
<Typography
            variant="h3"
            gutterBottom
            fontWeight={700}
            textAlign="center"
            mb={4}
          >
            📊 Dataset Overview
          </Typography>
{/* Dataset Info Cards */}
<Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <StorageIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={600}>
                  {info.filename}
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h3" fontWeight={700}>
                      {info.shape[0].toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Rows
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'success.main',
                      color: 'white',
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h3" fontWeight={700}>
                      {info.shape[1]}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Columns
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: missingCount > 0 ? 'warning.main' : 'success.main',
                      color: 'white',
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h3" fontWeight={700}>
                      {missingCount}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Missing Values
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
{/* Data Preview */}
<Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <TableIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={600}>
                  Data Preview (First 10 Rows)
                </Typography>
              </Box>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {preview.columns.map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        >
                          <Box>
                            {col}
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ opacity: 0.9, fontWeight: 400 }}
                            >
                              {preview.dtypes[col]}
                            </Typography>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.data.map((row, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                          '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.08)' },
                        }}
                      >
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx}>
                            {cell ?? <Chip label="NaN" size="small" color="warning" />}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
{/* Configuration */}
<Card sx={{ mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <SettingsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={600}>
                  Pipeline Configuration
                </Typography>
              </Box>

              <Stack spacing={4}>
                {/* Mode Selection */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600} mb={2}>
                    Processing Mode
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={mode === 'auto' ? 8 : 0}
                        sx={{
                          p: 3,
                          cursor: 'pointer',
                          border: mode === 'auto' ? 3 : 2,
                          borderColor: mode === 'auto' ? 'primary.main' : 'grey.300',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                          },
                        }}
                        onClick={() => setMode('auto')}
                      >
                        <Box textAlign="center">
                          <AutoIcon sx={{ fontSize: 50, color: 'primary.main', mb: 1 }} />
                          <Typography variant="h6" fontWeight={700} gutterBottom>
                            Auto Mode
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            AI-Powered automatic preprocessing
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={mode === 'step' ? 8 : 0}
                        sx={{
                          p: 3,
                          cursor: 'pointer',
                          border: mode === 'step' ? 3 : 2,
                          borderColor: mode === 'step' ? 'success.main' : 'grey.300',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: 'success.main',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                          },
                        }}
                        onClick={() => setMode('step')}
                      >
                        <Box textAlign="center">
                          <ManualIcon sx={{ fontSize: 50, color: 'success.main', mb: 1 }} />
                          <Typography variant="h6" fontWeight={700} gutterBottom>
                            Manual Mode
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Step-by-step configuration wizard
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Mode Description */}
                {mode === 'step' && (
<Alert severity="success" icon={<ManualIcon />} sx={{ fontSize: '1rem' }}>
                      You've selected <strong>Manual Mode</strong>. You'll configure each
                      preprocessing step individually in the wizard.
                    </Alert>
)}

                {mode === 'auto' && (
<Alert severity="info" icon={<AutoIcon />} sx={{ fontSize: '1rem' }}>
                      You've selected <strong>Auto Mode</strong>. AI will automatically choose
                      the best preprocessing strategies for your data.
                    </Alert>
)}

                {/* Save Options */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom fontWeight={600} mb={2}>
                    Save Options
                  </Typography>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={saveOptions.processed_data}
                            onChange={(e) =>
                              setSaveOptions({ ...saveOptions, processed_data: e.target.checked })
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            💾 Processed Data
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={saveOptions.report}
                            onChange={(e) =>
                              setSaveOptions({ ...saveOptions, report: e.target.checked })
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            📋 Report
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={saveOptions.explanations}
                            onChange={(e) =>
                              setSaveOptions({ ...saveOptions, explanations: e.target.checked })
                            }
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body1" fontWeight={500}>
                            💡 Explanations
                          </Typography>
                        }
                      />
                    </Stack>
                  </Paper>
                </Box>
              </Stack>
            </CardContent>
          </Card>
{/* Continue Button */}
<Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              ← Back
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinue}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              {mode === 'step'
                ? '🧙‍♂️ Start Configuration Wizard →'
                : '🚀 Start Pipeline →'}
            </Button>
          </Stack>
</Container>
    </Box>
  );
};

export default DatasetPage;
