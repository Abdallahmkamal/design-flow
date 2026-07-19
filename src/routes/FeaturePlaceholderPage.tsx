import styles from './FeaturePlaceholderPage.module.css';

interface FeaturePlaceholderPageProps {
  title: string;
  plannedPhase: string;
}

export function FeaturePlaceholderPage({
  plannedPhase,
  title,
}: FeaturePlaceholderPageProps) {
  return (
    <section className={styles.panel} aria-labelledby="placeholder-heading">
      <p>Synthetic placeholder</p>
      <h1 id="placeholder-heading">{title}</h1>
      <span>
        Product behavior is intentionally unavailable until {plannedPhase}.
      </span>
    </section>
  );
}
