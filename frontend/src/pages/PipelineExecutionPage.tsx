import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stack,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Button,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  DataObject as DataIcon,
  Code as CodeIcon,
  AutoGraph as GraphIcon,
  Psychology as BrainIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { startPipeline, getPipelineStatus } from '../api/endpoints';
import { usePipeline } from '../context/PipelineContext';
import type { PipelineStatus } from '../types/api';

const POLLING_INTERVAL = 1000; // 1 second

const STEPS = [
  { label: 'Missing Values', icon: DataIcon, description: 'Handling missing data' },
  { label: 'Encoding', icon: CodeIcon, description: 'Encoding categorical features' },
  { label: 'Scaling', icon: GraphIcon, description: 'Scaling numerical features' },
  { label: 'Model Training', icon: BrainIcon, description: 'Training ML model' },
  { label: 'Report', icon: ReportIcon, description: 'Generating report' },
];

const PipelineExecutionPage: React.FC = () => {
  const navigate = useNavigate();
  const { datasetId, config, pipelineId, setPipelineId, setStatus: setPipelineStatus } = usePipeline();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!datasetId || !config) {
      navigate('/');
      return;
    }

    // Start pipeline if not already started
    if (!pipelineId) {
      const start = async () => {
        try {
          setLoading(true);
          
          // Build pipeline config
          const pipelineConfig: any = {
            dataset_id: datasetId,
            mode: config.mode || 'auto',
            save_options: config.save_options || {
              processed_data: true,
              report: true,
              explanations: true,
            },
          };
          
          // Add manual config if in manual mode
          if (config.mode === 'step' && config.manual_config) {
            pipelineConfig.manual_config = config.manual_config;
          }
          
          const response = await startPipeline(pipelineConfig);
          setPipelineId(response.pipeline_id);
          setStatus(response);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to start pipeline. Please ensure the backend is running.');
          console.error('Pipeline start error:', err);
        } finally {
          setLoading(false);
        }
      };
      start();
    }
  }, [datasetId, config, pipelineId, setPipelineId, navigate]);

  // Poll for status updates
  useEffect(() => {
    if (!pipelineId) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const pollStatus = async () => {
      try {
        const statusData = await getPipelineStatus(pipelineId);
        setStatus(statusData);
        setPipelineStatus(statusData.status);

        // Update active step
        const stepIndex = STEPS.findIndex((step) =>
          step.label.toLowerCase().includes(statusData.current_step?.toLowerCase() || '')
        );
        if (stepIndex >= 0) {
          setActiveStep(stepIndex);
        }

        // Stop polling and navigate when completed or failed
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          
          if (statusData.status === 'completed') {
            setTimeout(() => navigate('/results'), 1000);
          }
        }
      } catch (err: any) {
        console.error('Status polling error:', err);
        setError(err.response?.data?.message || 'Failed to get pipeline status');
        
        // Stop polling on error
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    interval = setInterval(pollStatus, POLLING_INTERVAL);
    pollStatus(); // Initial call

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pipelineId, setPipelineStatus, navigate]);

  if (loading && !status) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={48} />
          <Typography variant="h6" mt={2} fontWeight={600}>
            Initializing Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Setting up your ML workflow...
          </Typography>
        </Card>
      </Container>
    );
  }

  if (error && !status) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          size="large"
          fullWidth
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  const statusColor =
    status?.status === 'completed'
      ? 'success'
      : status?.status === 'failed'
      ? 'error'
      : status?.status === 'running'
      ? 'primary'
      : 'default';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Pipeline Execution
        </Typography>
        <Chip
          label={status?.status || 'Starting'}
          color={statusColor as any}
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        />
      </Box>

      {/* Progress Overview */}
      <Card sx={{ mb: 3 }} elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                {status?.status === 'running'
                  ? 'Processing'
                  : status?.status === 'completed'
                  ? 'Completed'
                  : status?.status === 'failed'
                  ? 'Failed'
                  : 'Initializing'}
              </Typography>
              <Typography variant="h5" color="primary" fontWeight={700}>
                {status?.progress || 0}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={status?.progress || 0}
              sx={{ height: 8, borderRadius: 4 }}
            />

            {status?.current_step && (
              <Typography variant="body2" color="text.secondary">
                Current step: {status.current_step.replace(/_/g, ' ')}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Step Progress */}
      <Card sx={{ mb: 3 }} elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600} mb={2}>
            Processing Pipeline
          </Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            {STEPS.map((step, index) => {
              const stepStatus = status?.steps_completed?.find((s) =>
                step.label.toLowerCase().includes(s.step.toLowerCase())
              );
              const isActive = index === activeStep;
              const isCompleted = !!stepStatus;
              const StepIcon = step.icon;

              return (
                <Step key={step.label} completed={isCompleted}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: isCompleted
                            ? 'success.main'
                            : isActive
                            ? 'primary.main'
                            : 'grey.300',
                          color: isCompleted || isActive ? 'white' : 'grey.600',
                        }}
                      >
                        {isCompleted ? (
                          <CheckIcon sx={{ fontSize: 24 }} />
                        ) : isActive ? (
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                        ) : (
                          <StepIcon sx={{ fontSize: 20 }} />
                        )}
                      </Box>
                    )}
                  >
                    <Box ml={2}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={isActive ? 600 : 500}
                        color={isCompleted ? 'success.main' : isActive ? 'primary.main' : 'text.primary'}
                      >
                        {step.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: stepStatus ? 0.5 : 0 }}
                      >
                        {step.description}
                      </Typography>
                      {stepStatus && (
                        <Chip
                          label={`${stepStatus.duration?.toFixed(2)}s`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Error Display */}
      {status?.status === 'failed' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Pipeline Execution Failed
          </Typography>
          <Typography variant="body2">
            An error occurred during pipeline execution. Please check your data and configuration, then try again.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Alert>
      )}

      {/* Success Message */}
      {status?.status === 'completed' && (
        <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CheckIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Pipeline Completed Successfully
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your data has been processed and the model has been trained.
          </Typography>
          <CircularProgress size={24} sx={{ color: 'inherit' }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Redirecting to results...
          </Typography>
        </Card>
      )}
    </Container>
  );
};

export default PipelineExecutionPage;