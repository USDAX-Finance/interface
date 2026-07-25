import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// In production builds (import.meta.env.PROD === true) use the deployed API.
// In development, relative /api/* URLs route to the local API server.
// No base URL override needed.
if (import.meta.env.PROD) {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl) setBaseUrl(apiUrl);
}

createRoot(document.getElementById('root')!).render(<App />);
