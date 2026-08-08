/* eslint-disable react-refresh/only-export-components -- source-owned primitive family */
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { cn } from '../lib/cn';

export const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(function Avatar({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full bg-secondary text-secondary-foreground',
        className,
      )}
      {...props}
    />
  );
});

export const AvatarImage = forwardRef<
  ElementRef<typeof AvatarPrimitive.Image>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn('aspect-square size-full object-cover', className)}
      {...props}
    />
  );
});

export const AvatarFallback = forwardRef<
  ElementRef<typeof AvatarPrimitive.Fallback>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex size-full items-center justify-center font-sans text-sm font-medium',
        className,
      )}
      {...props}
    />
  );
});

export function getInitials(name: string) {
  return (name.replace(/\[[^\]]+\]/gu, ' ').match(/\p{L}[\p{L}\p{N}]*/gu) ?? [])
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
