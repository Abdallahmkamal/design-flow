import styles from './Avatar.module.css';

export function Avatar({
  name,
  decorative = false,
}: {
  name: string;
  decorative?: boolean;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <span className={styles.avatar} aria-hidden={decorative || undefined}>
      {initials}
      {!decorative ? <span className={styles.srOnly}>{name}</span> : null}
    </span>
  );
}
