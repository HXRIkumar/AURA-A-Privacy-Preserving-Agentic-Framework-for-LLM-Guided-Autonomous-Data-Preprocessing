// API Response Types

export interface Dataset {
  dataset_id: string;
  filename: string;
  size: number;
  rows: number;
  columns: number;
  upload_timestamp: string;
}

export interface DatasetInfo {
  dataset_id: string;
  filename: string;
  shape: [number, number];
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  missing_values: Record<string, number>;
  target_column: string | null;
}

export interface DatasetPreview {
  dataset_id: string;
  columns: string[];
  data: any[][];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
}

export interface PipelineConfig {
  dataset_id: string;
  mode: 'auto' | 'step';
  target_column?: string;
  test_size?: number;
  save_options: {
    processed_data: boolean;
    report: boolean;
    explanations: boolean;
  };
  manual_config?: {
    missing_strategies?: Record<string, string>; // column -> strategy
    encoding_strategies?: Record<string, string>; // column -> strategy
    scaling_strategies?: Record<string, string>; // column -> strategy
    model_algorithm?: string;
    target_column?: string; // Target column from wizard
    test_size?: number; // Test size from wizard
  };
  llm_recommendations?: LLMRecommendations;
}

export interface PipelineStatus {
  pipeline_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step: string;
  steps_completed: PipelineStep[];
  estimated_time_remaining?: number;
  error?: string;
}

export interface PipelineStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  details?: any;
}

export interface PipelineResults {
  pipeline_id: string;
  status: 'completed' | 'failed';
  execution_time: number;
  model_metrics: {
    accuracy: number;
    cv_score: number;
    cv_std: number;
  };
  preprocessing_summary: {
    missing_values?: any;
    encoding?: any;
    scaling?: any;
  };
  downloads: {
    processed_data: string;
    report: string;
    explanations: string;
    all: string;
  };
}

// LLM Types

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  dataset_id: string;
  message: string;
  conversation_history: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  timestamp: string;
}

export interface DatasetMetadata {
  dataset_id: string;
  dataset_name: string;
  columns: ColumnMetadata[];
  shape?: [number, number];
  sample_rows: any[][];
  target_column?: string;
}

export interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text';
  missing_pct: number;
  nunique: number;
  sample_values?: any[];
}

export interface LLMRecommendations {
  missing: {
    strategy: 'drop' | 'mean' | 'median' | 'mode';
    columns?: Record<string, string>; // column -> strategy
    explain: string;
    risk: string[];
  };
  encoding: {
    strategy: 'label' | 'onehot';
    columns: Record<string, 'label' | 'onehot'>; // column -> encoding type
    explain: string;
    risk: string[];
  };
  scaling: {
    strategy: 'standard' | 'minmax' | 'robust' | 'none';
    explain: string;
    risk: string[];
  };
  model: {
    algorithm: 'random_forest' | 'gradient_boosting' | 'logistic_regression' | 'svm';
    explain: string;
    risk: string[];
  };
}

export interface LLMAnalysisRequest {
  dataset_id: string;
  metadata: DatasetMetadata;
}

export interface LLMAnalysisResponse {
  recommendations: LLMRecommendations;
  conversation_context: string; // Initial context for chat
}

// Error Types

export interface APIError {
  error: string;
  detail?: string;
  status_code: number;
}
