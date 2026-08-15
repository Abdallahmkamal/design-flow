import designFlowMark from '../../assets/design-flow-mark.svg';
import styles from './AuthenticationPage.module.css';

export function SessionLoadingPage() {
  return (
    <main className={styles.sessionLoadingPage}>
      <img
        className={styles.sessionLoadingMark}
        src={designFlowMark}
        alt=""
        aria-hidden="true"
      />
      <p className="sr-only" role="status" aria-live="polite">
        Restoring your session…
      </p>
    </main>
  );
}
