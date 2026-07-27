import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { initializeMonitoring } from './shared/monitoring/monitoring';
import './styles/tokens.css';
import './styles/reset.css';
import './styles/global.css';

const rootElement = document.querySelector('#root');

if (!(rootElement instanceof HTMLElement)) {
  throw new Error('Design Flow could not find the application root.');
}

const applicationRoot = rootElement;

async function bootstrap() {
  await initializeMonitoring();

  createRoot(applicationRoot).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
