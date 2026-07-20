import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

import styles from './Select.module.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      children,
      className,
      description,
      error,
      hideLabel = false,
      id,
      label,
      required,
      ...selectProps
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const descriptionId = description ? `${selectId}-description` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className={styles.field}>
        <label
          className={hideLabel ? styles.srOnly : styles.label}
          htmlFor={selectId}
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
        <select
          {...selectProps}
          ref={ref}
          className={[styles.select, className].filter(Boolean).join(' ')}
          id={selectId}
          required={required}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
        >
          {children}
        </select>
        {error ? (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
