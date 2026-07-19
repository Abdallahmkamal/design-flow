import { Link } from 'react-router-dom';

import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.panel} aria-labelledby="not-found-title">
      <p>404</p>
      <h1 id="not-found-title">This Design Flow view does not exist</h1>
      <Link to="/">Return to the foundation dashboard</Link>
    </section>
  );
}
