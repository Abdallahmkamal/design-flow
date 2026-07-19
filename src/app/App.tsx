import { BrowserRouter } from 'react-router-dom';

import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';
import { RouteErrorBoundary } from './RouteErrorBoundary';

export function App() {
  return (
    <RouteErrorBoundary>
      <AppProviders>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
    </RouteErrorBoundary>
  );
}
