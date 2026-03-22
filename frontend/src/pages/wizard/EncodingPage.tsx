import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
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
  Chip,
} from '@mui/material';
import { ArrowBack, ArrowForward, Info } from '@mui/icons-material';
import { useWizard } from '../../context/WizardContext';
import { usePipeline } from '../../context/PipelineContext';
import { getDatasetInfo } from '../../api/endpoints';

const EncodingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, steps, manualConfig, updateColumnStrategy, nextStep, prevStep, completeStep } = useWizard();
  const { datasetId } = usePipeline();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) {
      navigate('/');
      return;
    }

    const fetchInfo = async () => {
      try {
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
    navigate('/wizard/scaling');
  };

  const handleBack = () => {
    prevStep();
    navigate('/wizard/missing-values');
  };

  const categoricalColumns = info
    ? info.columns.filter((col: string) => !info.numeric_columns.includes(col))
    : [];

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
        Step 2: Encode Categorical Features
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Convert categorical (text) data into numerical format that machine learning models can understand.
      </Typography>

      {/* Categorical Columns Summary */}
      {!loading && categoricalColumns.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
          Found {categoricalColumns.length} categorical column(s) that need encoding
        </Alert>
      )}

      {!loading && categoricalColumns.length === 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          No categorical columns found. Your dataset is already numeric!
        </Alert>
      )}

      {/* Strategy Selection - Per Column */}
      {!loading && categoricalColumns.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Choose Encoding Method for Each Column
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the encoding strategy for each categorical column individually
          </Typography>

          <Stack spacing={3}>
            {categoricalColumns.map((col: string) => {
              const currentStrategy = manualConfig.encoding_strategies?.[col] || 'label';
              
              return (
                <Card key={col} variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {col}
                      </Typography>
                      <Chip label="Categorical" color="secondary" size="small" />
                    </Box>

                    <FormControl fullWidth size="small">
                      <InputLabel>Encoding Method</InputLabel>
                      <Select
                        value={currentStrategy}
                        label="Encoding Method"
                        onChange={(e) => updateColumnStrategy('encoding_strategies', col, e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        }}
                      >
                        <MenuItem value="label">Label Encoding (0, 1, 2, ...)</MenuItem>
                        <MenuItem value="onehot">One-Hot Encoding (binary columns)</MenuItem>
                      </Select>
                    </FormControl>

                    {/* Strategy explanation */}
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {currentStrategy === 'label' && (
                          <>
                            <strong>Label Encoding:</strong> Each unique value gets a number (Red→0, Blue→1, Green→2).
                            Best for ordinal data or when order matters.
                          </>
                        )}
                        {currentStrategy === 'onehot' && (
                          <>
                            <strong>One-Hot Encoding:</strong> Creates separate binary columns for each value.
                            Best for nominal data without inherent order (prevents false relationships).
                          </>
                        )}
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
          Back: Missing Values
        </Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
          Next: Scaling
        </Button>
      </Box>
    </Container>
  );
};

export default EncodingPage;
