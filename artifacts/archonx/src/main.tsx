import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// Arahkan semua API call ke domain yang dikonfigurasi via env.
// Jika VITE_API_URL tidak di-set, gunakan relative path (dev default).
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) setBaseUrl(apiUrl);

createRoot(document.getElementById('root')!).render(<App />);
