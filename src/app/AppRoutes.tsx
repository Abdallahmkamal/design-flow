import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';

import { AccountInactivePage } from '../features/auth/AccountInactivePage';
import {
  InactiveAccountRoute,
  PasswordChangeRoute,
  ProtectedRoute,
  SignedOutRoute,
} from '../features/auth/AuthenticationRoutes';
import { ChangePasswordPage } from '../features/auth/ChangePasswordPage';
import { SignInPage } from '../features/auth/SignInPage';
import { NotFoundPage } from '../routes/NotFoundPage';
import { AppShell } from '../routes/shell/AppShell';

const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const ReportsPage = lazy(() =>
  import('../features/reports/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import('../features/notifications/NotificationsPage').then((module) => ({
    default: module.NotificationsPage,
  })),
);
const SettingsRoute = lazy(() =>
  import('../features/settings/SettingsPage').then((module) => ({
    default: module.SettingsRoute,
  })),
);
const AllTicketsPage = lazy(() =>
  import('../features/work-items/AllTicketsPage').then((module) => ({
    default: module.AllTicketsPage,
  })),
);
const WorkItemCreatePage = lazy(() =>
  import('../features/work-items/WorkItemCreatePage').then((module) => ({
    default: module.WorkItemCreatePage,
  })),
);
const WorkItemPage = lazy(() =>
  import('../features/work-items/WorkItemPage').then((module) => ({
    default: module.WorkItemPage,
  })),
);
const WorkItemEditPage = lazy(() =>
  import('../features/work-items/WorkItemEditPage').then((module) => ({
    default: module.WorkItemEditPage,
  })),
);
const WorkLogPage = lazy(() =>
  import('../features/work-logs/WorkLogPage').then((module) => ({
    default: module.WorkLogPage,
  })),
);
const WorkLogEditPage = lazy(() =>
  import('../features/work-logs/WorkLogEditPage').then((module) => ({
    default: module.WorkLogEditPage,
  })),
);

function featureElement(element: ReactNode) {
  return (
    <Suspense fallback={<p role="status">Loading page…</p>}>{element}</Suspense>
  );
}

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
          <Route index element={featureElement(<DashboardPage />)} />
          <Route path="reports" element={featureElement(<ReportsPage />)} />
          <Route
            path="notifications"
            element={featureElement(<NotificationsPage />)}
          />
          <Route
            path="work-items"
            element={featureElement(<AllTicketsPage />)}
          />
          <Route
            path="work-items/new"
            element={featureElement(<WorkItemCreatePage />)}
          />
          <Route
            path="work-items/:displayId"
            element={featureElement(<WorkItemPage />)}
          />
          <Route
            path="work-items/:displayId/edit"
            element={featureElement(<WorkItemEditPage />)}
          />
          <Route
            path="work-logs/new"
            element={featureElement(<WorkLogPage />)}
          />
          <Route
            path="work-logs/:batchId/edit"
            element={featureElement(<WorkLogEditPage />)}
          />
          <Route path="settings" element={featureElement(<SettingsRoute />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
