import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

import styles from './Textarea.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      className,
      description,
      error,
      hideLabel = false,
      id,
      label,
      required,
      ...textareaProps
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return (
      <div className={styles.field}>
        <label
          className={hideLabel ? styles.srOnly : styles.label}
          htmlFor={textareaId}
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
        <textarea
          {...textareaProps}
          ref={ref}
          className={[styles.textarea, className].filter(Boolean).join(' ')}
          id={textareaId}
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
  },
);
