import type { AnchorHTMLAttributes } from 'react';

import styles from './SkipLink.module.css';

export function SkipLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={styles.link}>
      Skip to main content
    </a>
  );
}
