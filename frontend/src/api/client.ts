import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG, REQUEST_CONFIG } from './config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: REQUEST_CONFIG.headers,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.params) {
      config.params._t = Date.now();
    } else {
      config.params = { _t: Date.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // No response received
      console.error('Network Error:', error.request);
    } else {
      // Request setup error
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to handle file downloads
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export default apiClient;
