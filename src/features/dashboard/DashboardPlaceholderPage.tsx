import { Link } from 'react-router-dom';

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
  return (
    <div className={styles.page}>
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>Local foundation checkpoint</p>
        <h1>Design work, with the operating context intact</h1>
        <p className={styles.summary}>
          This is a visibly synthetic Phase 1 shell. Ticket data,
          authentication, dashboards, and reports arrive only in their approved
          build phases.
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
          <p className={styles.eyebrow}>Next approved product slice</p>
          <h2 id="next-phase-heading">Authentication, Team, and Settings</h2>
          <p>
            Phase 2 will connect the protected account lifecycle and hierarchy
            contracts after this foundation passes its exit gate.
          </p>
        </div>
        <Link to="/sign-in">Preview the authentication placeholder</Link>
      </section>
    </div>
  );
}
