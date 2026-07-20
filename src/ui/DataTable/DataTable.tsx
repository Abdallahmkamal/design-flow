import type { ReactNode } from 'react';

import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  mobileLabel?: string;
}

export interface DataTableProps<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  emptyContent?: ReactNode;
}

export function DataTable<Row>({
  caption,
  columns,
  emptyContent,
  getRowKey,
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
                <th key={column.key} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
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
            <dl>
              {columns.map((column) => (
                <div className={styles.recordField} key={column.key}>
                  <dt>{column.mobileLabel ?? column.header}</dt>
                  <dd>{column.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
