import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthentication } from './authContext';
import { SessionLoadingPage } from './SessionLoadingPage';

function destinationForStatus(
  status: ReturnType<typeof useAuthentication>['status'],
) {
  if (status === 'signedOut') {
    return '/sign-in';
  }

  if (status === 'passwordChangeRequired') {
    return '/change-password';
  }

  if (status === 'inactive' || status === 'unavailable') {
    return '/account-inactive';
  }

  return '/';
}

export function SignedOutRoute() {
  const { status } = useAuthentication();

  if (status === 'loading') {
    return <SessionLoadingPage />;
  }

  return status === 'signedOut' ? (
    <Outlet />
  ) : (
    <Navigate to={destinationForStatus(status)} replace />
  );
}

export function PasswordChangeRoute() {
  const { status } = useAuthentication();

  if (status === 'loading') {
    return <SessionLoadingPage />;
  }

  return status === 'passwordChangeRequired' ? (
    <Outlet />
  ) : (
    <Navigate to={destinationForStatus(status)} replace />
  );
}

export function InactiveAccountRoute() {
  const { status } = useAuthentication();

  if (status === 'loading') {
    return <SessionLoadingPage />;
  }

  return status === 'inactive' || status === 'unavailable' ? (
    <Outlet />
  ) : (
    <Navigate to={destinationForStatus(status)} replace />
  );
}

export function ProtectedRoute() {
  const { status } = useAuthentication();
  const location = useLocation();

  if (status === 'loading') {
    return <SessionLoadingPage />;
  }

  if (status === 'active') {
    return <Outlet />;
  }

  return (
    <Navigate
      to={destinationForStatus(status)}
      replace
      state={status === 'signedOut' ? { from: location.pathname } : undefined}
    />
  );
}
