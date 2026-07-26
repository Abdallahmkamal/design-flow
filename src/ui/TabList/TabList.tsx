import { useRef, type KeyboardEvent } from 'react';

import styles from './TabList.module.css';

export interface TabListItem<Value extends string> {
  value: Value;
  label: string;
  panelId: string;
}

export function TabList<Value extends string>({
  label,
  items,
  value,
  onValueChange,
}: {
  label: string;
  items: readonly TabListItem<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (event: KeyboardEvent, index: number) => {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft')
      next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    onValueChange(items[next]!.value);
    refs.current[next]?.focus();
  };
  return (
    <div className={styles.list} role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.value}
          ref={(node) => {
            refs.current[index] = node;
          }}
          className={styles.tab}
          type="button"
          role="tab"
          id={`${item.panelId}-tab`}
          aria-controls={item.panelId}
          aria-selected={item.value === value}
          tabIndex={item.value === value ? 0 : -1}
          onClick={() => onValueChange(item.value)}
          onKeyDown={(event) => move(event, index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
