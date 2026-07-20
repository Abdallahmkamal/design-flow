import { AuthenticationPage } from './AuthenticationPage';

export function SessionLoadingPage() {
  return (
    <AuthenticationPage
      eyebrow="Secure access"
      title="Restoring your session"
      description="Design Flow is checking your account access."
    >
      <p role="status" aria-live="polite">
        Loading account…
      </p>
    </AuthenticationPage>
  );
}
