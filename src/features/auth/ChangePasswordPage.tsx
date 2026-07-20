import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { createOperationId } from '../../shared/operations/operationId';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import styles from './AuthenticationPage.module.css';
import { AuthenticationPage } from './AuthenticationPage';
import { useAuthentication } from './authContext';
import { AuthenticationActionError } from './authTypes';

const passwordPolicy = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[0-9]/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');

const changePasswordSchema = z
  .object({
    newPassword: passwordPolicy,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordPage() {
  const { changePassword, signOut } = useAuthentication();
  const navigate = useNavigate();
  const [operationId] = useState(createOperationId);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    const parsed = changePasswordSchema.safeParse(values);

    if (!parsed.success) {
      const invalidFields = new Set<string>();
      let shouldFocus = true;

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          (field === 'newPassword' || field === 'confirmPassword') &&
          !invalidFields.has(field)
        ) {
          invalidFields.add(field);
          setError(field, { message: issue.message }, { shouldFocus });
          shouldFocus = false;
        }
      }
      return;
    }

    try {
      const nextStatus = await changePassword(
        parsed.data.newPassword,
        operationId,
      );

      if (nextStatus === 'active') {
        await navigate('/', { replace: true });
      } else if (nextStatus === 'inactive' || nextStatus === 'unavailable') {
        await navigate('/account-inactive', { replace: true });
      }
    } catch (error) {
      setRequestError(
        error instanceof AuthenticationActionError &&
          error.code === 'DF_PASSWORD_COMPLETION_PENDING'
          ? 'Your new password was accepted, but account activation is still pending. Submit the same password again to finish activation.'
          : 'Design Flow could not change your password. Keep this page open and try again.',
      );
    }
  });

  const handleSignOut = async () => {
    setRequestError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      setRequestError(
        'Design Flow could not sign you out. Keep this page open and try again.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <AuthenticationPage
      eyebrow="Account protection"
      title="Change your password"
      description="Replace the temporary password before entering Design Flow."
      footer="Use at least 12 characters with lowercase and uppercase letters, a number, and a symbol."
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        {requestError ? (
          <p className={styles.message} role="alert">
            {requestError}
          </p>
        ) : null}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          {...(errors.newPassword?.message
            ? { error: errors.newPassword.message }
            : {})}
          {...register('newPassword')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          {...(errors.confirmPassword?.message
            ? { error: errors.confirmPassword.message }
            : {})}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Change password and continue
        </Button>
      </form>
      <div className={styles.actions}>
        <Button
          variant="ghost"
          isLoading={isSigningOut}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </AuthenticationPage>
  );
}
