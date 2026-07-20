import type { PropsWithChildren, ReactNode } from 'react';

import styles from './AuthenticationPage.module.css';

interface AuthenticationPageProps extends PropsWithChildren {
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}

export function AuthenticationPage({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthenticationPageProps) {
  const titleId = `auth-${title.toLowerCase().replaceAll(' ', '-')}`;

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby={titleId}>
        <span className={styles.brand}>Design Flow</span>
        <div className={styles.heading}>
          <p>{eyebrow}</p>
          <h1 id={titleId} tabIndex={-1}>
            {title}
          </h1>
          <span>{description}</span>
        </div>
        {children}
        {footer ? <div className={styles.notice}>{footer}</div> : null}
      </section>
    </main>
  );
}
