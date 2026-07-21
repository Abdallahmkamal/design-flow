import { Button } from '../Button/Button';
import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function Pagination({
  label = 'Results pages',
  onPageChange,
  page,
  pageSize,
  totalCount,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalCount <= pageSize) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);
  return (
    <nav className={styles.pagination} aria-label={label}>
      <p aria-live="polite">
        {first}–{last} of {totalCount}
      </p>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page} of {pageCount}
        </span>
        <Button
          variant="secondary"
          size="small"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
