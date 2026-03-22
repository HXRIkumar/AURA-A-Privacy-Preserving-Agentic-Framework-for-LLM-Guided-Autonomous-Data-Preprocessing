import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WizardStep {
  id: string;
  name: string;
  path: string;
  completed: boolean;
}

interface ManualConfiguration {
  missing_strategies?: Record<string, string>; // column -> strategy
  encoding_strategies?: Record<string, string>; // column -> strategy
  scaling_strategies?: Record<string, string>; // column -> strategy
  model_algorithm?: string;
  target_column?: string;
  test_size?: number;
}

interface WizardContextType {
  currentStep: number;
  steps: WizardStep[];
  manualConfig: ManualConfiguration;
  updateManualConfig: (key: string, value: string) => void;
  updateColumnStrategy: (strategyType: 'missing_strategies' | 'encoding_strategies' | 'scaling_strategies', column: string, strategy: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  completeStep: (stepIndex: number) => void;
  resetWizard: () => void;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'missing-values', name: 'Missing Values', path: '/wizard/missing-values', completed: false },
  { id: 'encoding', name: 'Encoding', path: '/wizard/encoding', completed: false },
  { id: 'scaling', name: 'Scaling', path: '/wizard/scaling', completed: false },
  { id: 'model-training', name: 'Model Training', path: '/wizard/model-training', completed: false },
];

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);
  const [manualConfig, setManualConfig] = useState<ManualConfiguration>({
    missing_strategies: {},
    encoding_strategies: {},
    scaling_strategies: {},
    model_algorithm: 'random_forest',
  });

  const updateManualConfig = (key: string, value: string) => {
    setManualConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateColumnStrategy = (strategyType: 'missing_strategies' | 'encoding_strategies' | 'scaling_strategies', column: string, strategy: string) => {
    setManualConfig((prev) => ({
      ...prev,
      [strategyType]: {
        ...prev[strategyType],
        [column]: strategy,
      },
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const completeStep = (stepIndex: number) => {
    setSteps((prev) =>
      prev.map((step, index) =>
        index === stepIndex ? { ...step, completed: true } : step
      )
    );
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setSteps(WIZARD_STEPS.map((step) => ({ ...step, completed: false })));
    setManualConfig({
      missing_strategies: {},
      encoding_strategies: {},
      scaling_strategies: {},
      model_algorithm: 'random_forest',
    });
  };

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        steps,
        manualConfig,
        updateManualConfig,
        updateColumnStrategy,
        nextStep,
        prevStep,
        goToStep,
        completeStep,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};
