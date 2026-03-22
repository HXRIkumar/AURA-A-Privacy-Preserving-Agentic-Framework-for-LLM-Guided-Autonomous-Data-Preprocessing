# AURA Preprocessor - Frontend

React + TypeScript frontend for the AURA Preprocessor 2.0 ML pipeline with LLM-powered chatbot.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend running on `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
```

### Running the Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### Building for Production

```bash
npm run build
```

Build output will be in the `dist/` folder.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                    # API client & endpoints
│   │   ├── client.ts           # Axios configuration
│   │   ├── config.ts           # API endpoints & config
│   │   └── endpoints.ts        # API functions
│   │
│   ├── components/             # React components
│   │   ├── chat/               # Chatbot components
│   │   │   └── FloatingChatButton.tsx
│   │   │
│   │   └── layout/             # Layout components
│   │       ├── Layout.tsx
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   │
│   ├── context/                # React Context
│   │   ├── ChatContext.tsx     # Chat state management
│   │   ├── PipelineContext.tsx # Pipeline state management
│   │   └── WizardContext.tsx   # Wizard step state
│   │
│   ├── pages/                  # Page components
│   │   ├── LandingPage.tsx
│   │   ├── DatasetPage.tsx
│   │   ├── PipelineExecutionPage.tsx
│   │   ├── ResultsPage.tsx
│   │   └── wizard/             # Step wizard pages
│   │       ├── MissingValuesPage.tsx
│   │       ├── EncodingPage.tsx
│   │       ├── ScalingPage.tsx
│   │       └── ModelTrainingPage.tsx
│   │
│   ├── types/                  # TypeScript types
│   │   ├── api.ts              # API response types
│   │   └── index.ts            # App state types
│   │
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   └── vite-env.d.ts           # Vite types
│
├── public/                     # Static assets
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── .env.example                # Environment variables example
└── .gitignore
```

---

## 🎯 Features

### ✅ Implemented Features

1. **File Upload**
   - Drag-and-drop CSV upload
   - File validation
   - Preview before processing

2. **Dataset Configuration**
   - Auto-detect target column
   - Configure test/train split
   - Select execution mode (Auto/Manual)

3. **LLM Chatbot**
   - Floating chat button (always accessible)
   - Conversation history with context
   - Auto-opens in Auto Mode
   - Dataset-aware recommendations

4. **Pipeline Execution**
   - Real-time progress tracking
   - Step-by-step visualization
   - LLM recommendations display (Auto Mode)
   - Ability to override LLM suggestions

5. **Results Dashboard**
   - Model performance metrics
   - Interactive visualizations
   - Download outputs (CSV, JSON)
   - Comprehensive report view

### 🎨 UI/UX Features

- **Responsive Design:** Works on desktop, tablet, and mobile
- **Material-UI:** Clean, modern component library
- **Smooth Animations:** Fade-ins, slide-ups, transitions
- **Error Handling:** User-friendly error messages
- **Loading States:** Spinners and progress indicators

---

## 🤖 LLM Integration

### How It Works

#### 1. **Dataset Upload**
```
User uploads CSV → Metadata extracted → Sent to chatbot context
```

#### 2. **Auto Mode**
```
User selects "Auto Mode" → Chat window opens automatically →
LLM analyzes metadata → Recommends preprocessing steps →
User reviews & can override → Clicks "Run" → Pipeline executes
```

#### 3. **Chat Functionality**
```
User asks question → Sent to backend with conversation history →
LLM responds with context-aware answer → History maintained
```

### API Integration Points

#### Chat Endpoint
```typescript
POST /api/v1/chat
Body: {
  dataset_id: string,
  message: string,
  conversation_history: ChatMessage[]
}
Response: {
  message: string,
  timestamp: string
}
```

#### LLM Analysis Endpoint
```typescript
POST /api/v1/llm/analyze-metadata
Body: {
  dataset_id: string,
  metadata: DatasetMetadata
}
Response: {
  recommendations: LLMRecommendations,
  conversation_context: string
}
```

### Metadata Format

```typescript
interface DatasetMetadata {
  dataset_name: string;
  columns: [
    {
      name: string;
      type: 'numeric' | 'categorical';
      missing_pct: number;
      nunique: number;
    }
  ];
  sample_rows: any[][];
  target_column?: string;
}
```

### LLM Recommendations Format

```typescript
interface LLMRecommendations {
  missing: {
    strategy: 'drop' | 'mean' | 'median' | 'mode';
    explain: string;
    risk: string[];
  };
  encoding: {
    strategy: 'label' | 'onehot';
    columns: Record<string, 'label' | 'onehot'>;
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
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# API Version
VITE_API_VERSION=v1
```

For production:

```env
VITE_API_BASE_URL=https://api.yourapp.com
VITE_API_VERSION=v1
```

### Vite Proxy Configuration

The development server proxies API requests to avoid CORS issues:

```typescript
// vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

---

## 🧪 Testing

### Manual Testing Checklist

#### 1. Upload Flow
- [ ] Drag-and-drop CSV file
- [ ] Click upload works
- [ ] File validation (size, format)
- [ ] Error handling for invalid files

#### 2. Dataset Preview
- [ ] Data table displays correctly
- [ ] Statistics show properly
- [ ] Target column auto-detection
- [ ] Configuration panel works

#### 3. Chatbot
- [ ] Floating button appears
- [ ] Chat opens/closes smoothly
- [ ] Messages send successfully
- [ ] History persists
- [ ] LLM context awareness

#### 4. Pipeline Execution
- [ ] Auto Mode opens chatbot
- [ ] LLM recommendations display
- [ ] User can override options
- [ ] Progress updates in real-time
- [ ] Steps complete successfully

#### 5. Results
- [ ] Metrics display correctly
- [ ] Charts render properly
- [ ] Downloads work
- [ ] Navigation works

---

## 🔧 Development

### Adding New Components

```typescript
// src/components/example/NewComponent.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface NewComponentProps {
  title: string;
}

const NewComponent: React.FC<NewComponentProps> = ({ title }) => {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};

export default NewComponent;
```

### Adding New API Endpoints

```typescript
// src/api/endpoints.ts
export const newEndpoint = async (data: any): Promise<any> => {
  const response = await apiClient.post('/api/v1/new-endpoint', data);
  return response.data;
};
```

### Creating Custom Hooks

```typescript
// src/hooks/useCustomHook.ts
import { useState, useEffect } from 'react';

export const useCustomHook = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Logic here
  }, []);

  return { state };
};
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"

**Solution:**
1. Ensure backend is running on `http://localhost:8000`
2. Check `.env` file has correct `VITE_API_BASE_URL`
3. Verify CORS is enabled on backend

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "TypeScript errors"

**Solution:**
```bash
npm run lint
# Fix any reported issues
```

### Issue: "Chat not working"

**Solution:**
1. Check browser console for errors
2. Verify backend `/api/v1/chat` endpoint exists
3. Check network tab for failed requests
4. Ensure Groq API key is configured in backend

---

## 📦 Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables (Production)

Set these in your deployment platform:

```
VITE_API_BASE_URL=https://your-backend-url.com
VITE_API_VERSION=v1
```

---

## 📚 Technologies Used

- **React 18:** UI library
- **TypeScript:** Type safety
- **Vite:** Build tool
- **Material-UI:** Component library
- **React Router:** Navigation
- **Axios:** HTTP client
- **React Query:** Data fetching (prepared for future use)

---

## 🎓 Learning Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Docs](https://mui.com/)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📝 Notes

### LLM Fallback Strategy

If LLM API fails:
1. Display error message
2. Switch to manual mode
3. User selects options manually
4. Chatbot becomes view-only

### Future Enhancements

- [ ] WebSocket for real-time updates (instead of polling)
- [ ] User authentication
- [ ] Project history persistence
- [ ] Dark mode toggle
- [ ] Export to Jupyter Notebook
- [ ] Model comparison feature

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0  
**License:** MIT
