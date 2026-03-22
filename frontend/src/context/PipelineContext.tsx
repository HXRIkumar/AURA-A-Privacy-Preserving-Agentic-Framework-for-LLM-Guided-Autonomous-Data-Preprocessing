import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DatasetInfo, PipelineConfig, PipelineResults } from '../types/api';

interface PipelineState {
  datasetId: string | null;
  datasetInfo: DatasetInfo | null;
  config: Partial<PipelineConfig> | null;
  pipelineId: string | null;
  status: string | null;
  results: PipelineResults | null;
}

interface PipelineContextType extends PipelineState {
  setDatasetId: (id: string) => void;
  setDatasetInfo: (info: DatasetInfo) => void;
  setConfig: (config: PipelineConfig) => void;
  updateConfig: (updates: Partial<PipelineConfig>) => void;
  setPipelineId: (id: string) => void;
  setStatus: (status: string) => void;
  setResults: (results: PipelineResults) => void;
  reset: () => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const usePipelineContext = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipelineContext must be used within PipelineProvider');
  }
  return context;
};

interface PipelineProviderProps {
  children: ReactNode;
}

export const PipelineProvider: React.FC<PipelineProviderProps> = ({ children }) => {
  const [state, setState] = useState<PipelineState>({
    datasetId: null,
    datasetInfo: null,
    config: null,
    pipelineId: null,
    status: null,
    results: null,
  });

  const setDatasetId = (id: string) => {
    setState((prev: PipelineState) => ({ ...prev, datasetId: id }));
  };

  const setDatasetInfo = (info: DatasetInfo) => {
    setState((prev: PipelineState) => ({ ...prev, datasetInfo: info }));
  };

  const setConfig = (config: PipelineConfig) => {
    setState((prev: PipelineState) => ({ ...prev, config }));
  };

  const updateConfig = (config: Partial<PipelineConfig>) => {
    setState((prev: PipelineState) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  };

  const setPipelineId = (id: string) => {
    setState((prev: PipelineState) => ({ ...prev, pipelineId: id }));
  };

  const setStatus = (status: string) => {
    setState((prev: PipelineState) => ({ ...prev, status }));
  };

  const setResults = (results: PipelineResults) => {
    setState((prev: PipelineState) => ({ ...prev, results }));
  };

  const reset = () => {
    setState({
      datasetId: null,
      datasetInfo: null,
      config: null,
      pipelineId: null,
      status: null,
      results: null,
    });
  };

  return (
    <PipelineContext.Provider
      value={{
        ...state,
        setDatasetId,
        setDatasetInfo,
        setConfig,
        updateConfig,
        setPipelineId,
        setStatus,
        setResults,
        reset,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};

// Hook for using pipeline context
export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within PipelineProvider');
  }
  return context;
};
