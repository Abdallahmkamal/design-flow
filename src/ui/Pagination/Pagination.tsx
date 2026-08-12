import { Button } from '../Button/Button';
import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: 25 | 50 | 100) => void;
  pageSizeOptions?: readonly (25 | 50 | 100)[];
  showPageNumbers?: boolean;
  showRange?: boolean;
  label?: string;
}

export function Pagination({
  label = 'Results pages',
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions = [25, 50, 100],
  showPageNumbers = true,
  showRange = true,
  totalCount,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const first = totalCount ? (page - 1) * pageSize + 1 : 0;
  const last = Math.min(page * pageSize, totalCount);
  const pages = Array.from(
    { length: pageCount },
    (_, index) => index + 1,
  ).filter(
    (candidate) =>
      pageCount <= 7 ||
      candidate === 1 ||
      candidate === pageCount ||
      Math.abs(candidate - page) <= 1,
  );
  return (
    <nav className={styles.pagination} aria-label={label}>
      {showRange ? (
        <p aria-live="polite">
          {totalCount ? `${first}–${last} of ${totalCount}` : '0 of 0'}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {showPageNumbers ? (
          <div
            className={styles.pageNumbers}
            aria-label={`Page ${page} of ${pageCount}`}
          >
            {pages.map((candidate, index) => (
              <span key={candidate} className={styles.pageNumberGroup}>
                {index > 0 && candidate - pages[index - 1]! > 1 ? (
                  <span aria-hidden="true">…</span>
                ) : null}
                <Button
                  variant="ghost"
                  size="small"
                  className={
                    candidate === page ? styles.currentPage : undefined
                  }
                  aria-current={candidate === page ? 'page' : undefined}
                  aria-label={`Page ${candidate}`}
                  onClick={() => onPageChange(candidate)}
                >
                  {candidate}
                </Button>
              </span>
            ))}
          </div>
        ) : (
          <span>
            Page {page} of {pageCount}
          </span>
        )}
        <Button
          variant="secondary"
          size="small"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
      {onPageSizeChange ? (
        <label className={styles.pageSize}>
          Rows per page
          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(
                Number(event.currentTarget.value) as 25 | 50 | 100,
              )
            }
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </nav>
  );
}
