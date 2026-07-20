import { getPublicEnvironment } from '../../shared/config/env';
import styles from './DashboardPlaceholderPage.module.css';

const foundationChecks = [
  {
    title: 'Runtime',
    detail: 'React, strict TypeScript, Vite, and declarative routing',
  },
  {
    title: 'Design system',
    detail: 'Vodafone semantic tokens with owned Design Flow components',
  },
  {
    title: 'Verification',
    detail: 'Lint, type, component, browser, and accessibility foundations',
  },
] as const;

export function DashboardPlaceholderPage() {
  const appEnvironment = getPublicEnvironment().VITE_APP_ENV;
  const environmentName =
    appEnvironment.charAt(0).toUpperCase() + appEnvironment.slice(1);

  return (
    <div className={styles.page}>
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>{environmentName} Phase 2 checkpoint</p>
        <h1>Design work, with the operating context intact</h1>
        <p className={styles.summary}>
          This visibly synthetic shell now enforces closed sign-in,
          authoritative account state, mandatory password change,
          inactive-account withholding, and sign-out. Ticket data, dashboards,
          and reports remain in their approved later phases.
        </p>
      </header>

      <section aria-labelledby="foundation-status">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Foundation status</p>
            <h2 id="foundation-status">The baseline being verified</h2>
          </div>
          <span className={styles.status}>In progress</span>
        </div>
        <div className={styles.checkGrid}>
          {foundationChecks.map((check) => (
            <article className={styles.checkCard} key={check.title}>
              <span className={styles.checkMark} aria-hidden="true">
                ✓
              </span>
              <div>
                <h3>{check.title}</h3>
                <p>{check.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.nextPhase}
        aria-labelledby="next-phase-heading"
      >
        <div>
          <p className={styles.eyebrow}>Remaining Phase 2 scope</p>
          <h2 id="next-phase-heading">Team hierarchy and Settings</h2>
          <p>
            Team hierarchy and Settings remain intentionally deferred from this
            authentication and account-lifecycle branch.
          </p>
        </div>
      </section>
    </div>
  );
}
