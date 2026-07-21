import type { ReactNode } from 'react';

import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  mobileLabel?: string;
  sortDirection?: 'ascending' | 'descending' | 'none';
  onSort?: () => void;
}

export interface DataTableProps<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  emptyContent?: ReactNode;
  renderMobileCard?: (row: Row) => ReactNode;
  onRowActivate?: (row: Row) => void;
  getRowAriaLabel?: (row: Row) => string;
}

export function DataTable<Row>({
  caption,
  columns,
  emptyContent,
  getRowKey,
  getRowAriaLabel,
  onRowActivate,
  renderMobileCard,
  rows,
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <div className={styles.empty}>{emptyContent}</div>;
  }

  return (
    <>
      <div
        className={styles.tableRegion}
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.srOnly}>{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={column.sortDirection}
                >
                  {column.onSort ? (
                    <button
                      className={styles.sortButton}
                      type="button"
                      onClick={column.onSort}
                    >
                      {column.header}
                      {column.sortDirection &&
                      column.sortDirection !== 'none' ? (
                        <span aria-hidden="true">
                          {column.sortDirection === 'ascending' ? ' ↑' : ' ↓'}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className={onRowActivate ? styles.interactiveRow : undefined}
                tabIndex={onRowActivate ? 0 : undefined}
                aria-label={getRowAriaLabel?.(row)}
                onClick={(event) => {
                  if (
                    onRowActivate &&
                    !(event.target as HTMLElement).closest(
                      'a, button, input, select, textarea',
                    )
                  )
                    onRowActivate(row);
                }}
                onKeyDown={(event) => {
                  if (
                    onRowActivate &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    onRowActivate(row);
                  }
                }}
              >
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={styles.recordList} aria-label={caption}>
        {rows.map((row) => (
          <li className={styles.record} key={getRowKey(row)}>
            {renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <dl>
                {columns.map((column) => (
                  <div className={styles.recordField} key={column.key}>
                    <dt>{column.mobileLabel ?? column.header}</dt>
                    <dd>{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
