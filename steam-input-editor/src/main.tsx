import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

// React Router basename must match Vite's `base` so `/padsmith/editor`
// resolves to the `/editor` route. Vite injects `import.meta.env.BASE_URL`
// (trailing slash included), and Router strips the trailing slash itself.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
