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
  Grid,
  Slider,
  Chip,
} from '@mui/material';
import { ArrowBack, PlayArrow, Info } from '@mui/icons-material';
import { useWizard } from '../../context/WizardContext';
import { usePipeline } from '../../context/PipelineContext';

const ModelTrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, steps, manualConfig, updateManualConfig, prevStep, completeStep } = useWizard();
  const { datasetId, datasetInfo, config, updateConfig } = usePipeline();
  const [targetColumn, setTargetColumn] = React.useState<string>('');
  const [testSize, setTestSize] = React.useState<number>(0.2);

  // Auto-detect target column on mount
  React.useEffect(() => {
    if (datasetInfo && !targetColumn) {
      // Try to find target column - typically last column or one named 'target', 'label', etc.
      const possibleTargets = ['target', 'label', 'survived', 'class', 'outcome', 'y', 'pclass'];
      
      // Exclude ID-like columns
      const excludePatterns = ['id', 'ticket', 'name', 'passengerid', 'index'];
      
      const found = datasetInfo.columns.find(col => {
        const colLower = col.toLowerCase();
        // Check if it matches target patterns and is not an ID column
        return possibleTargets.includes(colLower) && 
               !excludePatterns.some(pattern => colLower.includes(pattern));
      });
      
      // If not found, use last column that's not an ID-like column
      if (!found) {
        const validColumns = datasetInfo.columns.filter(col => {
          const colLower = col.toLowerCase();
          return !excludePatterns.some(pattern => colLower.includes(pattern));
        });
        setTargetColumn(validColumns[validColumns.length - 1] || datasetInfo.columns[datasetInfo.columns.length - 1]);
      } else {
        setTargetColumn(found);
      }
    }
  }, [datasetInfo, targetColumn]);

  if (!datasetId) {
    navigate('/');
    return null;
  }

  const handleStartPipeline = () => {
    completeStep(currentStep);
    
    // Update pipeline config with manual settings including target and test size
    updateConfig({
      ...config,
      mode: 'step',
      manual_config: {
        ...manualConfig,
        target_column: targetColumn,
        test_size: testSize,
      },
    });
    
    // Navigate to pipeline execution
    navigate('/pipeline');
  };

  const handleBack = () => {
    prevStep();
    navigate('/wizard/scaling');
  };

  const modelInfo: Record<string, { name: string; description: string; pros: string[]; cons: string[] }> = {
    random_forest: {
      name: 'Random Forest',
      description: 'Ensemble of decision trees that votes for the best prediction',
      pros: ['Handles non-linear relationships', 'Resistant to overfitting', 'Works well with mixed data types'],
      cons: ['Can be slow with large datasets', 'Less interpretable than single trees'],
    },
    logistic_regression: {
      name: 'Logistic Regression',
      description: 'Linear model for classification with probability outputs',
      pros: ['Fast training', 'Highly interpretable', 'Works well with linear relationships'],
      cons: ['Assumes linear decision boundary', 'May underfit complex patterns'],
    },
    gradient_boosting: {
      name: 'Gradient Boosting',
      description: 'Sequential ensemble that builds trees to correct previous errors',
      pros: ['Excellent accuracy', 'Handles complex patterns', 'Feature importance available'],
      cons: ['Prone to overfitting', 'Slower training', 'Requires tuning'],
    },
    svm: {
      name: 'Support Vector Machine (SVM)',
      description: 'Finds optimal hyperplane to separate classes',
      pros: ['Effective in high dimensions', 'Memory efficient', 'Versatile with kernels'],
      cons: ['Slow with large datasets', 'Sensitive to feature scaling', 'Hard to tune'],
    },
    decision_tree: {
      name: 'Decision Tree',
      description: 'Single tree that makes decisions based on feature values',
      pros: ['Highly interpretable', 'Fast training', 'No feature scaling needed'],
      cons: ['Prone to overfitting', 'Unstable (small data changes affect tree)'],
    },
  };

  const selectedModel = manualConfig.model_algorithm || 'random_forest';
  const modelDetails = modelInfo[selectedModel];

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
        Step 4: Train Machine Learning Model
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Choose the machine learning algorithm that will learn patterns from your data and make predictions.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
        After selecting your model, the pipeline will execute all preprocessing steps and train the model automatically.
      </Alert>

      {/* Training Configuration */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Training Configuration
        </Typography>
        
        <Stack spacing={3}>
          {/* Target Column Selection */}
          <FormControl fullWidth>
            <InputLabel>Target Column</InputLabel>
            <Select
              value={targetColumn}
              label="Target Column"
              onChange={(e) => setTargetColumn(e.target.value)}
            >
              {datasetInfo?.columns.map((col) => (
                <MenuItem key={col} value={col}>
                  {col}
                  {datasetInfo.numeric_columns.includes(col) && ' (Numeric)'}
                  {datasetInfo.categorical_columns.includes(col) && ' (Categorical)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Test Size */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2">
                Test Size
              </Typography>
              <Chip 
                label={`${(testSize * 100).toFixed(0)}% Test / ${(100 - testSize * 100).toFixed(0)}% Train`}
                color="primary"
                size="small"
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Percentage of data to use for testing the model (recommended: 20-30%)
            </Typography>
            <Slider
              value={testSize}
              onChange={(_, value) => setTestSize(value as number)}
              min={0.1}
              max={0.5}
              step={0.05}
              marks={[
                { value: 0.1, label: '10%' },
                { value: 0.2, label: '20%' },
                { value: 0.3, label: '30%' },
                { value: 0.4, label: '40%' },
                { value: 0.5, label: '50%' },
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Model Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Model Algorithm
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select the machine learning algorithm for your classification task
        </Typography>

        <FormControl fullWidth>
          <InputLabel>Algorithm</InputLabel>
          <Select
            value={manualConfig.model_algorithm || 'random_forest'}
            label="Algorithm"
            onChange={(e) => updateManualConfig('model_algorithm', e.target.value)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                },
              },
            }}
          >
            <MenuItem value="random_forest">Random Forest (Ensemble Method)</MenuItem>
            <MenuItem value="logistic_regression">Logistic Regression (Simple & Fast)</MenuItem>
            <MenuItem value="gradient_boosting">Gradient Boosting (High Accuracy)</MenuItem>
            <MenuItem value="svm">SVM (Support Vector Machine)</MenuItem>
            <MenuItem value="decision_tree">Decision Tree (Interpretable)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Model Details Card */}
      <Card sx={{ mb: 3, borderColor: 'primary.main', borderWidth: 2 }} variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {modelDetails.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {modelDetails.description}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                ✅ Advantages
              </Typography>
              <Stack spacing={0.5}>
                {modelDetails.pros.map((pro, idx) => (
                  <Typography key={idx} variant="body2">
                    • {pro}
                  </Typography>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                ⚠️ Considerations
              </Typography>
              <Stack spacing={0.5}>
                {modelDetails.cons.map((con, idx) => (
                  <Typography key={idx} variant="body2">
                    • {con}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'primary.main' }} elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📋 Pipeline Configuration Summary
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Training Configuration */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Training Configuration:
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Target Column:</Typography>
                    <Typography variant="body2" fontWeight={600}>{targetColumn}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Test Size:</Typography>
                    <Typography variant="body2" fontWeight={600}>{(testSize * 100).toFixed(0)}%</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Model Algorithm */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                  Model Algorithm:
                </Typography>
                <Typography variant="body2" fontWeight={600}>{modelDetails.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {modelDetails.description}
                </Typography>
              </Paper>
            </Grid>

            {/* Missing Values Summary */}
            {manualConfig.missing_strategies && Object.keys(manualConfig.missing_strategies).length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    Missing Values Strategies:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(manualConfig.missing_strategies).map(([col, strategy]) => (
                      <Grid item xs={12} sm={6} md={4} key={col}>
                        <Box sx={{ 
                          p: 1.5, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'background.paper'
                        }}>
                          <Typography variant="caption" color="text.secondary">{col}</Typography>
                          <Typography variant="body2" fontWeight={600}>{strategy}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Encoding Summary */}
            {manualConfig.encoding_strategies && Object.keys(manualConfig.encoding_strategies).length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    Encoding Strategies:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(manualConfig.encoding_strategies).map(([col, strategy]) => (
                      <Grid item xs={12} sm={6} md={4} key={col}>
                        <Box sx={{ 
                          p: 1.5, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'background.paper'
                        }}>
                          <Typography variant="caption" color="text.secondary">{col}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {strategy === 'onehot' ? 'One-Hot Encoding' : 
                             strategy === 'label' ? 'Label Encoding' : strategy}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Scaling Summary */}
            {manualConfig.scaling_strategies && Object.keys(manualConfig.scaling_strategies).length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                    Scaling Strategies:
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(manualConfig.scaling_strategies).map(([col, strategy]) => (
                      <Grid item xs={12} sm={6} md={4} key={col}>
                        <Box sx={{ 
                          p: 1.5, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'background.paper'
                        }}>
                          <Typography variant="caption" color="text.secondary">{col}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {strategy === 'minmax' ? 'Min-Max Scaler' :
                             strategy === 'standard' ? 'Standard Scaler' :
                             strategy === 'robust' ? 'Robust Scaler' :
                             strategy === 'none' ? 'No Scaling' : strategy}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between">
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
          Back: Scaling
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<PlayArrow />}
          onClick={handleStartPipeline}
        >
          Start Pipeline Execution
        </Button>
      </Box>
    </Container>
  );
};

export default ModelTrainingPage;
