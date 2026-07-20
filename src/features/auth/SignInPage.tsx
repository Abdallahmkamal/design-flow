import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import styles from './AuthenticationPage.module.css';
import { AuthenticationPage } from './AuthenticationPage';
import { useAuthentication } from './authContext';
import { AuthenticationActionError } from './authTypes';

const signInSchema = z.object({
  email: z.email('Enter a valid work email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type SignInValues = z.infer<typeof signInSchema>;

interface ReturnLocationState {
  from?: string;
}

export function SignInPage() {
  const { signIn } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    const parsed = signInSchema.safeParse(values);

    if (!parsed.success) {
      const invalidFields = new Set<string>();
      let shouldFocus = true;

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          (field === 'email' || field === 'password') &&
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
      const nextStatus = await signIn(parsed.data.email, parsed.data.password);

      if (nextStatus === 'passwordChangeRequired') {
        await navigate('/change-password', { replace: true });
      } else if (nextStatus === 'inactive' || nextStatus === 'unavailable') {
        await navigate('/account-inactive', { replace: true });
      } else if (nextStatus === 'active') {
        const state = location.state as ReturnLocationState | null;
        await navigate(state?.from ?? '/', { replace: true });
      }
    } catch (error) {
      setRequestError(
        error instanceof AuthenticationActionError &&
          error.code === 'DF_SIGN_IN_UNAVAILABLE'
          ? 'Design Flow could not reach the sign-in service. Check your connection and try again.'
          : 'The email or password is incorrect. Check your details and try again.',
      );
    }
  });

  return (
    <AuthenticationPage
      eyebrow="Closed team access"
      title="Sign in"
      description="Use the work account provisioned by a Design Flow administrator."
      footer="Need a new account or password reset? Contact a Design Flow administrator. Public registration and self-service reset are not available."
    >
      <form className={styles.form} onSubmit={submit} noValidate>
        {requestError ? (
          <p className={styles.message} role="alert">
            {requestError}
          </p>
        ) : null}
        <Input
          label="Work email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          {...(errors.email?.message ? { error: errors.email.message } : {})}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          {...(errors.password?.message
            ? { error: errors.password.message }
            : {})}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthenticationPage>
  );
}
