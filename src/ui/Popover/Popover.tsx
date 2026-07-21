import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '../Button/Button';
import styles from './Popover.module.css';

export interface PopoverProps {
  label: string;
  trigger: ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  children: ReactNode;
  align?: 'start' | 'end';
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Popover({
  align = 'start',
  children,
  label,
  trigger,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useCallback(() => {
    rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    returnFocus();
  }, [returnFocus]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [close, open]);

  return (
    <span className={styles.root} ref={rootRef}>
      {cloneElement(trigger, {
        'aria-expanded': open,
        'aria-controls': open ? panelId : undefined,
        'aria-haspopup': 'dialog',
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) setOpen((value) => !value);
        },
      })}
      {open ? (
        <div
          className={[styles.panel, styles[align]].join(' ')}
          id={panelId}
          ref={panelRef}
          role="dialog"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            } else if (event.key === 'Tab') {
              const controls = Array.from(
                panelRef.current?.querySelectorAll<HTMLElement>(
                  focusableSelector,
                ) ?? [],
              );
              const first = controls[0];
              const last = controls.at(-1);
              if (!first || !last) return;
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }
          }}
        >
          <div className={styles.header}>
            <strong>{label}</strong>
            <Button
              size="small"
              variant="ghost"
              aria-label={`Close ${label}`}
              onClick={close}
            >
              Close
            </Button>
          </div>
          {children}
        </div>
      ) : null}
    </span>
  );
}
