import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, type ComponentProps } from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from 'react-day-picker';

import { cn } from '../lib/cn';
import { Button, buttonVariants } from './button';

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('bg-background p-3 [--cell-size:2.25rem]', className)}
      classNames={{
        root: cn('w-fit', defaults.root),
        months: cn('relative flex flex-col gap-4', defaults.months),
        month: cn('flex w-full flex-col gap-4', defaults.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex items-center justify-between',
          defaults.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-[var(--cell-size)]',
          defaults.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'size-[var(--cell-size)]',
          defaults.button_next,
        ),
        month_caption: cn(
          'flex h-[var(--cell-size)] items-center justify-center px-[var(--cell-size)]',
          defaults.month_caption,
        ),
        caption_label: cn('text-sm font-medium', defaults.caption_label),
        month_grid: cn('w-full border-collapse', defaults.month_grid),
        weekdays: cn('flex', defaults.weekdays),
        weekday: cn(
          'flex-1 text-center text-xs font-normal text-muted-foreground',
          defaults.weekday,
        ),
        week: cn('mt-2 flex w-full', defaults.week),
        day: cn(
          'relative size-[var(--cell-size)] p-0 text-center text-sm',
          defaults.day,
        ),
        today: cn('rounded-md bg-muted text-foreground', defaults.today),
        outside: cn('text-muted-foreground opacity-50', defaults.outside),
        disabled: cn('text-muted-foreground opacity-40', defaults.disabled),
        hidden: cn('invisible', defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...iconProps }) => {
          const Icon =
            orientation === 'left'
              ? ChevronLeft
              : orientation === 'right'
                ? ChevronRight
                : ChevronDown;
          return <Icon {...iconProps} className="size-4" />;
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        'size-[var(--cell-size)] border-0 p-0 font-normal data-[selected-single=true]:bg-foreground data-[selected-single=true]:text-primary-foreground! data-[selected-single=true]:hover:bg-foreground data-[selected-single=true]:hover:text-primary-foreground!',
        className,
      )}
      data-selected-single={modifiers.selected ? true : undefined}
      {...props}
    />
  );
}
