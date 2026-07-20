import { useState } from 'react';

import { Button } from '../../ui/Button/Button';
import styles from './AuthenticationPage.module.css';
import { AuthenticationPage } from './AuthenticationPage';
import { useAuthentication } from './authContext';

export function AccountInactivePage() {
  const { refreshAccount, status, signOut } = useAuthentication();
  const inactive = status === 'inactive';
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleRetry = async () => {
    setActionError(null);
    setIsRetrying(true);

    const nextStatus = await refreshAccount();

    if (nextStatus === 'unavailable') {
      setActionError(
        'Design Flow still cannot verify this account. Check your connection and try again.',
      );
    }

    setIsRetrying(false);
  };

  const handleSignOut = async () => {
    setActionError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      setActionError(
        'Design Flow could not sign you out. Keep this page open and try again.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AuthenticationPage
      eyebrow="Access unavailable"
      title={inactive ? 'Account inactive' : 'Account unavailable'}
      description={
        inactive
          ? 'This account no longer has access to Design Flow.'
          : 'Design Flow could not resolve an eligible account for this session.'
      }
      footer="Contact a Design Flow administrator if you believe your access should be restored."
    >
      {actionError ? (
        <p className={styles.message} role="alert">
          {actionError}
        </p>
      ) : null}
      <div className={styles.actions}>
        {!inactive ? (
          <Button
            variant="secondary"
            isLoading={isRetrying}
            onClick={handleRetry}
          >
            Retry account check
          </Button>
        ) : null}
        <Button isLoading={isSigningOut} onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </AuthenticationPage>
  );
}
