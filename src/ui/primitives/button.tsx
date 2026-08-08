/* eslint-disable react-refresh/only-export-components -- shadcn-style variant export */
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-175 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-primary bg-primary text-primary-foreground! hover:brightness-95',
        secondary:
          'border border-border bg-secondary text-secondary-foreground! hover:bg-accent',
        ghost:
          'border border-transparent bg-transparent text-foreground! hover:bg-accent',
        destructive:
          'border border-destructive bg-destructive text-destructive-foreground! hover:brightness-95',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        default: 'h-10 px-4',
        lg: 'h-11 px-5 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild = false,
      children,
      className,
      disabled,
      isLoading = false,
      leadingIcon,
      size,
      type = 'button',
      variant,
      ...props
    },
    ref,
  ) {
    if (asChild) {
      return (
        <Slot
          {...props}
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          aria-busy={isLoading || undefined}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        {...props}
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        type={type}
        disabled={isLoading || disabled}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[spin_3s_linear_infinite]"
            aria-hidden="true"
          />
        ) : (
          leadingIcon
        )}
        {children}
      </button>
    );
  },
);
