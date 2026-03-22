import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { ArrowBack, ArrowForward, Info } from '@mui/icons-material';
import { useWizard } from '../../context/WizardContext';
import { usePipeline } from '../../context/PipelineContext';

const ScalingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, steps, manualConfig, updateColumnStrategy, nextStep, prevStep, completeStep } = useWizard();
  const { datasetId } = usePipeline();
  const [info, setInfo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!datasetId) {
      navigate('/');
      return;
    }

    const fetchInfo = async () => {
      try {
        const { getDatasetInfo } = await import('../../api/endpoints');
        const data = await getDatasetInfo(datasetId);
        setInfo(data);
      } catch (err) {
        console.error('Failed to fetch dataset info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [datasetId, navigate]);

  const handleNext = () => {
    completeStep(currentStep);
    nextStep();
    navigate('/wizard/model-training');
  };

  const handleBack = () => {
    prevStep();
    navigate('/wizard/encoding');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep}>
          {steps.map((step) => (
            <Step key={step.id} completed={step.completed}>
              <StepLabel>{step.name}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Typography variant="h4" gutterBottom>
        Step 3: Scale Numerical Features
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Normalize numerical features to ensure all values are on a similar scale, improving model performance.
      </Typography>

      {!loading && info && info.numeric_columns && info.numeric_columns.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
          Found {info.numeric_columns.length} numerical column(s) to scale
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Loading dataset information...
        </Alert>
      )}

      {!loading && (!info || !info.numeric_columns || info.numeric_columns.length === 0) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No numerical columns found to scale.
        </Alert>
      )}

      {/* Strategy Selection - Per Column */}
      {!loading && info && info.numeric_columns && info.numeric_columns.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Choose Scaling Method for Each Column
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the best scaling strategy for each numerical column individually
          </Typography>

          <Stack spacing={3}>
            {info.numeric_columns.map((col: string) => {
              const currentStrategy = manualConfig.scaling_strategies?.[col] || 'standard';
              
              return (
                <Card key={col} variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {col}
                      </Typography>
                      <Chip label="Numeric" color="primary" size="small" />
                    </Box>

                    <FormControl fullWidth size="small">
                      <InputLabel>Scaling Method</InputLabel>
                      <Select
                        value={currentStrategy}
                        label="Scaling Method"
                        onChange={(e) => updateColumnStrategy('scaling_strategies', col, e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        }}
                      >
                        <MenuItem value="standard">Standard Scaler (mean=0, std=1)</MenuItem>
                        <MenuItem value="minmax">MinMax Scaler (range 0-1)</MenuItem>
                        <MenuItem value="robust">Robust Scaler (handles outliers)</MenuItem>
                        <MenuItem value="none">No Scaling</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Strategy hint */}
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {currentStrategy === 'standard' && '📊 Z-score normalization: (X - mean) / std'}
                        {currentStrategy === 'minmax' && '📏 Scales to 0-1 range: (X - min) / (max - min)'}
                        {currentStrategy === 'robust' && '💪 Uses median/IQR, robust to outliers'}
                        {currentStrategy === 'none' && '🚫 No scaling applied (good for tree-based models)'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between">
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
          Back: Encoding
        </Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
          Next: Model Training
        </Button>
      </Box>
    </Container>
  );
};

export default ScalingPage;
