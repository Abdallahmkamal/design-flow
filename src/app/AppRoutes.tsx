import { Route, Routes } from 'react-router-dom';

import { DashboardPlaceholderPage } from '../features/dashboard/DashboardPlaceholderPage';
import { SignInPlaceholderPage } from '../features/auth/SignInPlaceholderPage';
import { FeaturePlaceholderPage } from '../routes/FeaturePlaceholderPage';
import { NotFoundPage } from '../routes/NotFoundPage';
import { AppShell } from '../routes/shell/AppShell';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPlaceholderPage />} />
      <Route element={<AppShell />}>
        <Route index element={<DashboardPlaceholderPage />} />
        <Route
          path="work-items"
          element={
            <FeaturePlaceholderPage title="Work items" plannedPhase="Phase 3" />
          }
        />
        <Route
          path="reports"
          element={
            <FeaturePlaceholderPage title="Reports" plannedPhase="Phase 6" />
          }
        />
        <Route
          path="team"
          element={
            <FeaturePlaceholderPage
              title="Team and settings"
              plannedPhase="Phase 2"
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
