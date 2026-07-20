import { Route, Routes } from 'react-router-dom';

import { DashboardPlaceholderPage } from '../features/dashboard/DashboardPlaceholderPage';
import { AccountInactivePage } from '../features/auth/AccountInactivePage';
import {
  InactiveAccountRoute,
  PasswordChangeRoute,
  ProtectedRoute,
  SignedOutRoute,
} from '../features/auth/AuthenticationRoutes';
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage';
import { SignInPage } from '../features/auth/SignInPage';
import { FeaturePlaceholderPage } from '../routes/FeaturePlaceholderPage';
import { NotFoundPage } from '../routes/NotFoundPage';
import { AppShell } from '../routes/shell/AppShell';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SignedOutRoute />}>
        <Route path="/sign-in" element={<SignInPage />} />
      </Route>
      <Route element={<PasswordChangeRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route element={<InactiveAccountRoute />}>
        <Route path="/account-inactive" element={<AccountInactivePage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPlaceholderPage />} />
          <Route
            path="work-items"
            element={
              <FeaturePlaceholderPage
                title="Work items"
                plannedPhase="Phase 3"
              />
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
                title="Team"
                plannedPhase="Phase 2 — separate slice"
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
