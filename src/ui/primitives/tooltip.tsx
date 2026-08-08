/* eslint-disable react-refresh/only-export-components -- source-owned primitive family */
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { cn } from '../lib/cn';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent(
  { className, sideOffset = 6, collisionPadding = 8, ...props },
  ref,
) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 max-w-[18.75rem] rounded-sm bg-foreground px-3 py-2 font-sans text-xs text-background shadow-popover data-[state=closed]:animate-out data-[state=delayed-open]:animate-in motion-reduce:transition-none',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
