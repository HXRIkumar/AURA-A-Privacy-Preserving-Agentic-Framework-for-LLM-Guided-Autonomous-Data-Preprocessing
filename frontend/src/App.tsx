import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ChatProvider } from './context/ChatContext';
import { PipelineProvider } from './context/PipelineContext';
import { WizardProvider } from './context/WizardContext';

// Pages
import LandingPage from './pages/LandingPage';
import DatasetPage from './pages/DatasetPage';
import PipelineExecutionPage from './pages/PipelineExecutionPage';
import ResultsPage from './pages/ResultsPage';

// Wizard Pages
import MissingValuesPage from './pages/wizard/MissingValuesPage';
import EncodingPage from './pages/wizard/EncodingPage';
import ScalingPage from './pages/wizard/ScalingPage';
import ModelTrainingPage from './pages/wizard/ModelTrainingPage';

// Components
import Layout from './components/layout/Layout';
import FloatingChatButton from './components/chat/FloatingChatButton';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1', // Indigo
    },
    secondary: {
      main: '#8B5CF6', // Purple
    },
    success: {
      main: '#10B981', // Green
    },
    warning: {
      main: '#F59E0B', // Amber
    },
    error: {
      main: '#EF4444', // Red
    },
    info: {
      main: '#3B82F6', // Blue
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PipelineProvider>
          <WizardProvider>
            <ChatProvider>
              <Router>
                <Layout>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dataset" element={<DatasetPage />} />
                    <Route path="/pipeline" element={<PipelineExecutionPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    
                    {/* Manual Mode Wizard Routes */}
                    <Route path="/wizard/missing-values" element={<MissingValuesPage />} />
                    <Route path="/wizard/encoding" element={<EncodingPage />} />
                    <Route path="/wizard/scaling" element={<ScalingPage />} />
                    <Route path="/wizard/model-training" element={<ModelTrainingPage />} />
                  </Routes>
                  <FloatingChatButton />
                </Layout>
              </Router>
            </ChatProvider>
          </WizardProvider>
        </PipelineProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
