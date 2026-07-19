import { Link } from 'react-router-dom';

import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import styles from './SignInPlaceholderPage.module.css';

export function SignInPlaceholderPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="sign-in-title">
        <Link className={styles.brand} to="/">
          Design Flow
        </Link>
        <div className={styles.heading}>
          <p>Phase 1 component preview</p>
          <h1 id="sign-in-title">Sign in</h1>
          <span>
            Authentication is intentionally not connected until Phase 2.
          </span>
        </div>
        <form className={styles.form}>
          <Input
            label="Work email"
            type="email"
            autoComplete="username"
            placeholder="designer@example.test"
            disabled
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            disabled
          />
          <Button type="submit" disabled>
            Sign in — available in Phase 2
          </Button>
        </form>
        <p className={styles.notice}>
          Synthetic preview only. Public registration is not part of Design
          Flow.
        </p>
      </section>
    </main>
  );
}
