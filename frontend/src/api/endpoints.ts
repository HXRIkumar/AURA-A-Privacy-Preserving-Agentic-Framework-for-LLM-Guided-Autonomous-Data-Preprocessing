import apiClient, { downloadFile } from './client';
import { ENDPOINTS } from './config';
import {
  Dataset,
  DatasetInfo,
  DatasetPreview,
  PipelineConfig,
  PipelineStatus,
  PipelineResults,
  ChatRequest,
  ChatResponse,
  LLMAnalysisRequest,
  LLMAnalysisResponse,
} from '../types/api';

// Dataset APIs
export const uploadDataset = async (file: File): Promise<Dataset> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<Dataset>(ENDPOINTS.upload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getDatasetInfo = async (datasetId: string): Promise<DatasetInfo> => {
  const response = await apiClient.get<DatasetInfo>(
    ENDPOINTS.datasetInfo(datasetId)
  );
  return response.data;
};

// Get dataset preview
export const getDatasetPreview = async (
  datasetId: string,
  limit: number = 10
): Promise<DatasetPreview> => {
  const response = await apiClient.get<DatasetPreview>(`/api/v1/datasets/${datasetId}/preview`, {
    params: { limit },
  });
  return response.data;
};

// Alias for consistency
export const previewDataset = getDatasetPreview;

export const deleteDataset = async (datasetId: string): Promise<void> => {
  await apiClient.delete(ENDPOINTS.deleteDataset(datasetId));
};

// Pipeline APIs
export const startPipeline = async (
  config: PipelineConfig
): Promise<PipelineStatus> => {
  const response = await apiClient.post<PipelineStatus>(
    ENDPOINTS.pipelineStart,
    config
  );
  return response.data;
};

export const getPipelineStatus = async (
  pipelineId: string
): Promise<PipelineStatus> => {
  const response = await apiClient.get<PipelineStatus>(
    ENDPOINTS.pipelineStatus(pipelineId)
  );
  return response.data;
};

export const pausePipeline = async (pipelineId: string): Promise<void> => {
  await apiClient.post(ENDPOINTS.pipelinePause(pipelineId));
};

export const resumePipeline = async (pipelineId: string): Promise<void> => {
  await apiClient.post(ENDPOINTS.pipelineResume(pipelineId));
};

export const cancelPipeline = async (pipelineId: string): Promise<void> => {
  await apiClient.post(ENDPOINTS.pipelineCancel(pipelineId));
};

// Results APIs
// Get pipeline results
export const getPipelineResults = async (pipelineId: string): Promise<PipelineResults> => {
  const response = await apiClient.get<PipelineResults>(ENDPOINTS.results(pipelineId));
  return response.data;
};

// Alias for consistency
export const getResults = getPipelineResults;

export const getReport = async (pipelineId: string): Promise<any> => {
  const response = await apiClient.get(ENDPOINTS.report(pipelineId));
  return response.data;
};

export const getExplanations = async (pipelineId: string): Promise<any> => {
  const response = await apiClient.get(ENDPOINTS.explanations(pipelineId));
  return response.data;
};

// Download APIs
export const downloadProcessedData = async (pipelineId: string): Promise<Blob> => {
  const response = await apiClient.get(ENDPOINTS.downloadProcessed(pipelineId), {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadReportFile = async (pipelineId: string): Promise<Blob> => {
  const response = await apiClient.get(ENDPOINTS.downloadReport(pipelineId), {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadExplanationsFile = async (pipelineId: string): Promise<Blob> => {
  const response = await apiClient.get(ENDPOINTS.downloadExplanations(pipelineId), {
    responseType: 'blob',
  });
  return response.data;
};

// Aliases for consistency
export const downloadReport = downloadReportFile;
export const downloadExplanations = downloadExplanationsFile;

export const downloadAllFiles = async (
  pipelineId: string,
  filename: string
): Promise<void> => {
  await downloadFile(ENDPOINTS.downloadAll(pipelineId), filename);
};

// LLM APIs
export const sendChatMessage = async (
  request: ChatRequest
): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>(ENDPOINTS.chat, request);
  return response.data;
};

export const analyzeLLMMetadata = async (
  request: LLMAnalysisRequest
): Promise<LLMAnalysisResponse> => {
  const response = await apiClient.post<LLMAnalysisResponse>(
    ENDPOINTS.llmAnalyze,
    request
  );
  return response.data;
};

// Utility APIs
export const checkHealth = async (): Promise<{ status: string }> => {
  const response = await apiClient.get(ENDPOINTS.health);
  return response.data;
};

export const getVersion = async (): Promise<{ version: string }> => {
  const response = await apiClient.get(ENDPOINTS.version);
  return response.data;
};

export const validateCSV = async (file: File): Promise<{ valid: boolean; message?: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(ENDPOINTS.validateCSV, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
