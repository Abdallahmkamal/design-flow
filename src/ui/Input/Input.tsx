import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    description,
    error,
    hideLabel = false,
    id,
    label,
    required,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

  return (
    <div className={styles.field}>
      <label
        className={hideLabel ? styles.srOnly : styles.label}
        htmlFor={inputId}
      >
        {label}
        {required && !hideLabel ? (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {description ? (
        <p className={styles.description} id={descriptionId}>
          {description}
        </p>
      ) : null}
      <input
        {...inputProps}
        ref={ref}
        className={[styles.input, className].filter(Boolean).join(' ')}
        id={inputId}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
      />
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
