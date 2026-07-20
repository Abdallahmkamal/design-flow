import type { HTMLAttributes, PropsWithChildren } from 'react';

import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface BadgeProps extends PropsWithChildren<
  HTMLAttributes<HTMLSpanElement>
> {
  tone?: BadgeTone;
}

export function Badge({
  children,
  className,
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[styles.badge, styles[tone], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
