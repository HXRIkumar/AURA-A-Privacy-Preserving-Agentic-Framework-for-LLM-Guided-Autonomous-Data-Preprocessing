import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ChatMessage, LLMRecommendations, DatasetMetadata } from '../types/api';
import { sendChatMessage, analyzeLLMMetadata } from '../api/endpoints';

interface ChatContextType {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  datasetId: string | null;
  metadata: DatasetMetadata | null;
  llmRecommendations: LLMRecommendations | null;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  setDatasetContext: (datasetId: string, metadata: DatasetMetadata) => void;
  analyzeLLM: () => Promise<LLMRecommendations | null>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

// Alias for consistency
export const useChat = useChatContext;

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [llmRecommendations, setLlmRecommendations] = useState<LLMRecommendations | null>(null);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const setDatasetContext = useCallback((id: string, meta: DatasetMetadata) => {
    setDatasetId(id);
    setMetadata(meta);
    
    // Add system message with dataset context
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `Dataset loaded: ${meta.dataset_name}. I have access to the dataset metadata and can help you with preprocessing decisions.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([systemMessage]);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!datasetId) {
      console.error('No dataset context set');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        dataset_id: datasetId,
        message,
        conversation_history: messages,
      });

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, messages]);

  const analyzeLLM = useCallback(async (): Promise<LLMRecommendations | null> => {
    if (!datasetId || !metadata) {
      console.error('No dataset context for LLM analysis');
      return null;
    }

    setIsLoading(true);
    try {
      const response = await analyzeLLMMetadata({
        dataset_id: datasetId,
        metadata,
      });

      setLlmRecommendations(response.recommendations);
      
      // Add system message with recommendations
      const recommendationMessage: ChatMessage = {
        role: 'system',
        content: 'LLM analysis complete. Recommendations are ready for Auto Mode.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, recommendationMessage]);

      return response.recommendations;
    } catch (error) {
      console.error('LLM analysis error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, metadata]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setDatasetId(null);
    setMetadata(null);
    setLlmRecommendations(null);
  }, []);

  const value: ChatContextType = {
    isOpen,
    messages,
    isLoading,
    datasetId,
    metadata,
    llmRecommendations,
    openChat,
    closeChat,
    toggleChat,
    sendMessage,
    setDatasetContext,
    analyzeLLM,
    clearChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
