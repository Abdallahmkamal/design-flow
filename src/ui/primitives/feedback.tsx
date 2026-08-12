import type { HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-md bg-muted motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        'grid gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function Empty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'grid min-h-28 place-items-center rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
