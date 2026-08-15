import {
  useEffect,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import styles from './AuthenticationPage.module.css';
import { InteractiveDotField } from './InteractiveDotField';

interface AuthenticationPageProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description: string;
  footer?: ReactNode;
  interactiveBackground?: boolean;
}

export function AuthenticationPage({
  children,
  description,
  eyebrow,
  footer,
  interactiveBackground = false,
  title,
}: AuthenticationPageProps) {
  const titleId = `auth-${title.toLowerCase().replaceAll(' ', '-')}`;
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [title]);

  return (
    <main className={styles.page}>
      {interactiveBackground ? <InteractiveDotField /> : null}
      <section className={styles.panel} aria-labelledby={titleId}>
        <div className={styles.heading}>
          {eyebrow ? <p>{eyebrow}</p> : null}
          <h1 ref={titleRef} id={titleId} tabIndex={-1}>
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
