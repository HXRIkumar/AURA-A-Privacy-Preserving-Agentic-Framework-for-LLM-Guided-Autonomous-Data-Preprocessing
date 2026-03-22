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
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, ArrowForward, Info } from '@mui/icons-material';
import { useWizard } from '../../context/WizardContext';
import { usePipeline } from '../../context/PipelineContext';
import { getDatasetInfo } from '../../api/endpoints';

interface MissingColumn {
  column: string;
  count: number;
  percentage: number;
}

const MissingValuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, steps, manualConfig, updateColumnStrategy, nextStep, completeStep } = useWizard();
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
    navigate('/wizard/encoding');
  };

  const handleStrategyChange = (column: string, strategy: string) => {
    console.log('Changing strategy for', column, 'to', strategy);
    updateColumnStrategy('missing_strategies', column, strategy);
  };

  const missingColumns: MissingColumn[] = info
    ? Object.entries(info.missing_values || {})
        .filter(([_, count]) => (count as number) > 0)
        .map(([col, count]) => ({
          column: col,
          count: count as number,
          percentage: ((count as number) / info.shape[0]) * 100,
        }))
    : [];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" mt={3}>
          Loading dataset information...
        </Typography>
      </Container>
    );
  }

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
        Step 1: Handle Missing Values
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Choose how to handle missing values in your dataset. Different strategies work better for different types of data.
      </Typography>

      {/* Missing Values Summary */}
      {missingColumns.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
          Found missing values in {missingColumns.length} column(s)
        </Alert>
      )}

      {missingColumns.length === 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Great! No missing values detected in your dataset.
        </Alert>
      )}

      {/* Strategy Selection - Per Column */}
      {missingColumns.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Choose Strategy for Each Column
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the best method to handle missing values for each column individually
          </Typography>

          <Stack spacing={3}>
            {missingColumns.map((col) => {
              const isNumeric = info.numeric_columns.includes(col.column);
              const currentStrategy = manualConfig.missing_strategies?.[col.column] || (isNumeric ? 'mean' : 'mode');
              
              return (
                <Box key={col.column}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3,
                      '&:hover': {
                        boxShadow: 2,
                      },
                    }}
                  >
                    {/* Column Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {col.column}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {col.count} missing values ({col.percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <Chip
                        label={isNumeric ? 'Numeric' : 'Categorical'}
                        color={isNumeric ? 'primary' : 'secondary'}
                        size="medium"
                      />
                    </Box>

                    {/* Strategy Selector */}
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Select Strategy</InputLabel>
                      <Select
                        value={currentStrategy}
                        label="Select Strategy"
                        onChange={(e) => handleStrategyChange(col.column, e.target.value as string)}
                        sx={{
                          '& .MuiSelect-select': {
                            py: 1.5,
                          },
                        }}
                      >
                        {isNumeric ? (
                          [
                            <MenuItem key="mean" value="mean">
                              📊 Mean - Use average value
                            </MenuItem>,
                            <MenuItem key="median" value="median">
                              📈 Median - Use middle value (robust to outliers)
                            </MenuItem>,
                            <MenuItem key="mode" value="mode">
                              🎯 Mode - Use most frequent value
                            </MenuItem>,
                            <MenuItem key="forward_fill" value="forward_fill">
                              ⏭️ Forward Fill - Copy from previous row
                            </MenuItem>,
                            <MenuItem key="backward_fill" value="backward_fill">
                              ⏮️ Backward Fill - Copy from next row
                            </MenuItem>,
                            <MenuItem key="drop" value="drop">
                              🗑️ Drop Rows - Remove rows with missing values
                            </MenuItem>,
                          ]
                        ) : (
                          [
                            <MenuItem key="mode" value="mode">
                              🎯 Mode - Use most frequent value
                            </MenuItem>,
                            <MenuItem key="forward_fill" value="forward_fill">
                              ⏭️ Forward Fill - Copy from previous row
                            </MenuItem>,
                            <MenuItem key="backward_fill" value="backward_fill">
                              ⏮️ Backward Fill - Copy from next row
                            </MenuItem>,
                            <MenuItem key="drop" value="drop">
                              🗑️ Drop Rows - Remove rows with missing values
                            </MenuItem>,
                          ]
                        )}
                      </Select>
                    </FormControl>

                    {/* Strategy Description */}
                    <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                      <Typography variant="body2">
                        {currentStrategy === 'mean' && '📊 Mean imputation fills missing values with the average. Best for normally distributed data.'}
                        {currentStrategy === 'median' && '📈 Median imputation uses the middle value. More robust when data has outliers.'}
                        {currentStrategy === 'mode' && '🎯 Mode imputation uses the most common value. Great for categorical or skewed data.'}
                        {currentStrategy === 'forward_fill' && '⏭️ Forward fill copies the last valid value. Useful for time-series or ordered data.'}
                        {currentStrategy === 'backward_fill' && '⏮️ Backward fill copies the next valid value. Alternative to forward fill.'}
                        {currentStrategy === 'drop' && '🗑️ Drop rows removes all rows with missing values. Use when data is abundant and missing randomly.'}
                      </Typography>
                    </Alert>
                  </Paper>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dataset')}
          size="large"
        >
          Back to Dataset
        </Button>
        <Button 
          variant="contained" 
          endIcon={<ArrowForward />} 
          onClick={handleNext}
          size="large"
        >
          Next: Encoding
        </Button>
      </Box>
    </Container>
  );
};

export default MissingValuesPage;
