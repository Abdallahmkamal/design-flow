import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { className, description, error, id, label, ...inputProps },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={inputId}>
          <input
            {...inputProps}
            ref={ref}
            className={styles.input}
            id={inputId}
            type="checkbox"
            aria-describedby={describedBy || undefined}
            aria-invalid={error ? true : undefined}
          />
          <span>{label}</span>
        </label>
        {description ? (
          <p className={styles.description} id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
