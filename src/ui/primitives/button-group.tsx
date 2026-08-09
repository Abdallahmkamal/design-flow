import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

const buttonGroupVariants = cva(
  'flex w-full items-stretch *:focus-visible:relative *:focus-visible:z-10',
  {
    variants: {
      orientation: {
        horizontal:
          '*:rounded-r-none [&>[data-slot]:last-child]:rounded-r-md [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0',
        vertical:
          'flex-col *:rounded-b-none [&>[data-slot]:last-child]:rounded-b-md [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

export function ButtonGroup({
  className,
  orientation,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}
