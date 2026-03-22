// API Configuration

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  TIMEOUT: 30000,
};

// API Endpoints
export const ENDPOINTS = {
  // Dataset Management
  upload: '/api/v1/upload',
  datasets: '/api/v1/datasets',
  datasetPreview: (id: string) => `/api/v1/datasets/${id}/preview`,
  datasetInfo: (id: string) => `/api/v1/datasets/${id}`,
  deleteDataset: (id: string) => `/api/v1/datasets/${id}`,

  // Pipeline Execution
  pipelineStart: '/api/v1/pipeline/start',
  pipelineStatus: (id: string) => `/api/v1/pipeline/status/${id}`,
  pipelinePause: (id: string) => `/api/v1/pipeline/pause/${id}`,
  pipelineResume: (id: string) => `/api/v1/pipeline/resume/${id}`,
  pipelineCancel: (id: string) => `/api/v1/pipeline/cancel/${id}`,

  // Results
  results: (id: string) => `/api/v1/results/${id}`,
  report: (id: string) => `/api/v1/reports/${id}`,
  explanations: (id: string) => `/api/v1/explanations/${id}`,

  // Downloads
  downloadProcessed: (id: string) => `/api/v1/download/processed/${id}`,
  downloadReport: (id: string) => `/api/v1/download/report/${id}`,
  downloadExplanations: (id: string) => `/api/v1/download/explanations/${id}`,
  downloadAll: (id: string) => `/api/v1/download/all/${id}`,

  // LLM Integration
  chat: '/api/v1/chat',
  llmAnalyze: '/api/v1/llm/analyze-metadata',
  llmExplain: '/api/v1/llm/explain-step',

  // Utilities
  health: '/api/v1/health',
  version: '/api/v1/version',
  validateCSV: '/api/v1/validate-csv',
};

// Request Configuration
export const REQUEST_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_CONFIG.TIMEOUT,
};

// Polling Configuration
export const POLLING_CONFIG = {
  interval: 1000, // 1 second
  maxRetries: 3,
};
