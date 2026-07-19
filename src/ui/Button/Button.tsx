import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      disabled,
      isLoading = false,
      leadingIcon,
      size = 'medium',
      type = 'button',
      variant = 'primary',
      ...buttonProps
    },
    ref,
  ) {
    const explicitAriaLabel = buttonProps['aria-label'];
    const loadingAriaLabel =
      isLoading && typeof children === 'string'
        ? `${children}, loading`
        : explicitAriaLabel;
    const classes = [styles.button, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        {...buttonProps}
        ref={ref}
        className={classes}
        type={type}
        disabled={isLoading ? true : disabled}
        aria-busy={isLoading || undefined}
        aria-label={explicitAriaLabel ?? loadingAriaLabel}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles.srOnly}>Loading: </span>
          </>
        ) : (
          leadingIcon && (
            <span className={styles.icon} aria-hidden="true">
              {leadingIcon}
            </span>
          )
        )}
        <span>{children}</span>
      </button>
    );
  },
);
