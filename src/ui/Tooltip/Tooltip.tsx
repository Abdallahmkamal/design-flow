import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type ReactElement,
} from 'react';

import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: string;
  children: ReactElement<React.HTMLAttributes<HTMLElement>>;
}

export function Tooltip({ children, content }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const hide = () => {
    clearTimer();
    setOpen(false);
  };
  const showAfterDelay = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), 200);
  };
  useEffect(() => () => clearTimer(), []);
  return (
    <span
      className={styles.anchor}
      onMouseEnter={showAfterDelay}
      onMouseLeave={hide}
      onFocusCapture={() => {
        clearTimer();
        setOpen(true);
      }}
      onBlurCapture={(event: FocusEvent<HTMLSpanElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hide();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide();
      }}
    >
      {cloneElement(children, {
        'aria-describedby':
          [children.props['aria-describedby'], open ? id : undefined]
            .filter(Boolean)
            .join(' ') || undefined,
      })}
      {open ? (
        <span className={styles.tooltip} id={id} role="tooltip">
          {content}
        </span>
      ) : null}
    </span>
  );
}
