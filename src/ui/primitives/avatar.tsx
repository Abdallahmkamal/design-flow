/* eslint-disable react-refresh/only-export-components -- source-owned primitive family */
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { cn } from '../lib/cn';

export type AvatarTone =
  'aqua' | 'aubergine' | 'pharos' | 'turquoise' | 'violet';

const avatarTones: readonly AvatarTone[] = [
  'aqua',
  'aubergine',
  'pharos',
  'turquoise',
  'violet',
];

const avatarToneClassNames: Record<AvatarTone, string> = {
  aqua: 'bg-[var(--color-avatar-aqua-background)] text-[var(--color-avatar-aqua-text)]',
  aubergine:
    'bg-[var(--color-avatar-aubergine-background)] text-[var(--color-avatar-aubergine-text)]',
  pharos:
    'bg-[var(--color-avatar-pharos-background)] text-[var(--color-avatar-pharos-text)]',
  turquoise:
    'bg-[var(--color-avatar-turquoise-background)] text-[var(--color-avatar-turquoise-text)]',
  violet:
    'bg-[var(--color-avatar-violet-background)] text-[var(--color-avatar-violet-text)]',
};

export function getAvatarTone(identity: string): AvatarTone {
  return avatarTones[
    [...identity].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % avatarTones.length
  ]!;
}

export function getAvatarToneClassName(identity: string) {
  return avatarToneClassNames[getAvatarTone(identity)];
}

export const Avatar = forwardRef<
  ElementRef<typeof AvatarPrimitive.Root>,
  ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(function Avatar({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-[var(--radius-element)] bg-secondary text-secondary-foreground',
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
