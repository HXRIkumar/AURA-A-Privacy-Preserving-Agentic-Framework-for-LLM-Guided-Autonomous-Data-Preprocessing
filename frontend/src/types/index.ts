export interface AppState {
  dataset: DatasetState | null;
  pipeline: PipelineState | null;
  chat: ChatState;
}

export interface DatasetState {
  file: File | null;
  dataset_id: string | null;
  info: any | null;
  preview: any | null;
  config: PipelineConfigState;
}

export interface PipelineConfigState {
  mode: 'auto' | 'step';
  target_column: string | null;
  test_size: number;
  save_options: {
    processed_data: boolean;
    report: boolean;
    explanations: boolean;
  };
}

export interface PipelineState {
  pipeline_id: string | null;
  status: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_step: string | null;
  results: any | null;
  error: string | null;
}

export interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  dataset_id: string | null;
  metadata: any | null;
  llm_recommendations: any | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
