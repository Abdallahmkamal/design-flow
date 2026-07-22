import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Badge, type BadgeTone } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import { Input } from '../../ui/Input/Input';
import { Pagination } from '../../ui/Pagination/Pagination';
import { Popover } from '../../ui/Popover/Popover';
import { Select } from '../../ui/Select/Select';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import {
  parseWorkItemFilters,
  serializeWorkItemFilters,
  type WorkItemFilters,
  type WorkItemSort,
  type WorkItemView,
} from './workItemFilters';
import { getWorkItemOptions, listWorkItems } from './workItemsApi';
import type { WorkItemListRow, WorkItemOption } from './workItemTypes';
import styles from './WorkItems.module.css';

const statusTones: Record<string, BadgeTone> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  in_review: 'in_review',
  paused: 'paused',
  done: 'done',
};
const views: { value: WorkItemView; label: string }[] = [
  { value: 'current', label: 'Current' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(`${value}T00:00:00Z`))
    : '—';

function MultiFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: WorkItemOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <fieldset className={styles.checkboxGroup}>
      <legend>{label}</legend>
      {options.map((option) => (
        <Checkbox
          key={option.id}
          label={option.label}
          checked={selected.includes(option.id)}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? [...selected, option.id]
                : selected.filter((id) => id !== option.id),
            )
          }
        />
      ))}
    </fieldset>
  );
}

export function AllTicketsPage() {
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseWorkItemFilters(params), [params]);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const list = useQuery({
    queryKey: ['work-items', filters],
    queryFn: () => listWorkItems(filters),
  });

  const update = (patch: Partial<WorkItemFilters>) =>
    setParams(
      serializeWorkItemFilters({ ...filters, ...patch, page: patch.page ?? 1 }),
    );
  const sort = (field: WorkItemSort) =>
    update({
      sort: field,
      direction:
        filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc',
    });
  const sortDirection = (field: WorkItemSort) =>
    filters.sort === field
      ? filters.direction === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none';

  const columns: readonly DataTableColumn<WorkItemListRow>[] = [
    {
      key: 'ticket',
      header: 'Ticket',
      sortDirection: sortDirection('display_id'),
      onSort: () => sort('display_id'),
      render: (row) => (
        <div className={styles.ticketCell}>
          <Link to={`/work-items/${row.displayId}`}>{row.displayId}</Link>
          <strong>{row.title}</strong>
          <div className={styles.indicators}>
            {row.isBlocked ? <Badge tone="blocked">Blocked</Badge> : null}
            {row.isArchived ? <Badge tone="archived">Archived</Badge> : null}
          </div>
        </div>
      ),
    },
    { key: 'area', header: 'Area / Squad', render: (row) => row.area.name },
    {
      key: 'status',
      header: 'Status',
      sortDirection: sortDirection('status'),
      onSort: () => sort('status'),
      render: (row) => (
        <Badge tone={statusTones[row.status.code] ?? 'neutral'}>
          {row.status.label}
        </Badge>
      ),
    },
    {
      key: 'people',
      header: 'People',
      render: (row) => (
        <div>
          {row.assignee?.displayName ?? 'Unassigned'}
          {row.contributors.length ? (
            <Popover
              label={`Contributors to ${row.displayId}`}
              align="end"
              trigger={
                <Button size="small" variant="ghost">
                  +{row.contributors.length} contributors
                </Button>
              }
            >
              <ul className={styles.simpleList}>
                {row.contributors.map((person) => (
                  <li key={person.id}>{person.displayName}</li>
                ))}
              </ul>
            </Popover>
          ) : null}
        </div>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      sortDirection: sortDirection('due_date'),
      onSort: () => sort('due_date'),
      render: (row) => (
        <span>
          {date(row.dueDate)}
          {row.isStale ? <Badge tone="warning">Stale</Badge> : null}
        </span>
      ),
    },
    {
      key: 'subtasks',
      header: 'Subtasks',
      render: (row) => `${row.completedSubtasks}/${row.totalSubtasks}`,
    },
    {
      key: 'figma',
      header: 'Figma',
      render: (row) =>
        row.figmaUrl ? (
          <Tooltip content="Open in Figma">
            <a
              className={styles.iconLink}
              href={row.figmaUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${row.displayId} in Figma (opens in a new tab)`}
            >
              ↗
            </a>
          </Tooltip>
        ) : (
          '—'
        ),
    },
  ];

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ search: searchDraft.trim() });
  };
  const noResults = Boolean(
    filters.search ||
    filters.peopleIds.length ||
    filters.statusCodes.length ||
    filters.areaIds.length ||
    filters.labelIds.length ||
    filters.relationship ||
    filters.blocked ||
    filters.due ||
    filters.stale,
  );

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Work-item foundation</p>
          <h1>All Tickets</h1>
          <p>
            Search, filter, sort, and review current and historical Work Items.
          </p>
        </div>
        {account?.positionCode !== 'viewer' ? (
          <div className={styles.headerActions}>
            <Link className={styles.secondaryLink} to="/work-logs/new">
              Log work
            </Link>
            <Link className={styles.primaryLink} to="/work-items/new">
              Create ticket
            </Link>
          </div>
        ) : null}
      </header>
      <nav className={styles.viewTabs} aria-label="Ticket views">
        {views.map((view) => (
          <button
            key={view.value}
            type="button"
            aria-current={filters.view === view.value ? 'page' : undefined}
            onClick={() => update({ view: view.value })}
          >
            {view.label}
          </button>
        ))}
      </nav>
      <form className={styles.searchBar} role="search" onSubmit={submitSearch}>
        <Input
          label="Search tickets"
          placeholder="Ticket ID, title, or description"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>
      <details className={styles.filters}>
        <summary>Filters and sort</summary>
        <div className={styles.filterGrid}>
          <Select
            label="Ownership relationship"
            value={filters.relationship}
            onChange={(event) =>
              update({
                relationship: event.target
                  .value as WorkItemFilters['relationship'],
              })
            }
          >
            <option value="">Any relationship</option>
            <option value="owned">Assigned to</option>
            <option value="contributed">Contributed to</option>
            <option value="owned_or_contributed">
              Assigned or contributed
            </option>
          </Select>
          <Select
            label="Blocker"
            value={filters.blocked}
            onChange={(event) =>
              update({
                blocked: event.target.value as WorkItemFilters['blocked'],
              })
            }
          >
            <option value="">Any blocker state</option>
            <option value="blocked">Blocked</option>
            <option value="unblocked">Not blocked</option>
          </Select>
          <Select
            label="Due date"
            value={filters.due}
            onChange={(event) =>
              update({ due: event.target.value as WorkItemFilters['due'] })
            }
          >
            <option value="">Any due date</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due soon</option>
            <option value="no_due_date">No due date</option>
          </Select>
          <Select
            label="Activity"
            value={filters.stale}
            onChange={(event) =>
              update({ stale: event.target.value as WorkItemFilters['stale'] })
            }
          >
            <option value="">Any activity</option>
            <option value="stale">Stale</option>
            <option value="active">Recently active</option>
          </Select>
          <Select
            label="Sort"
            value={`${filters.sort}:${filters.direction}`}
            onChange={(event) => {
              const [field, direction] = event.target.value.split(':');
              update({
                sort: field as WorkItemSort,
                direction: direction as 'asc' | 'desc',
              });
            }}
          >
            <option value="due_date:asc">Due date, earliest</option>
            <option value="due_date:desc">Due date, latest</option>
            <option value="last_worked_on:desc">Last worked, latest</option>
            <option value="created_at:desc">Created, latest</option>
            <option value="title:asc">Title, A–Z</option>
          </Select>
          {options.data ? (
            <>
              <MultiFilter
                label="People"
                options={options.data.people}
                selected={filters.peopleIds}
                onChange={(peopleIds) => update({ peopleIds })}
              />
              <MultiFilter
                label="Statuses"
                options={options.data.statuses.map((item) => ({
                  id: item.code,
                  label: item.label,
                }))}
                selected={filters.statusCodes}
                onChange={(statusCodes) => update({ statusCodes })}
              />
              <MultiFilter
                label="Areas / Squads"
                options={options.data.areas}
                selected={filters.areaIds}
                onChange={(areaIds) => update({ areaIds })}
              />
              <MultiFilter
                label="Labels"
                options={options.data.labels}
                selected={filters.labelIds}
                onChange={(labelIds) => update({ labelIds })}
              />
            </>
          ) : null}
          <Button
            variant="secondary"
            onClick={() => {
              setSearchDraft('');
              setParams(new URLSearchParams());
            }}
          >
            Clear filters
          </Button>
        </div>
      </details>
      {list.isPending ? (
        <div className={styles.state} role="status">
          Loading tickets…
        </div>
      ) : list.isError ? (
        <div className={styles.state} role="alert">
          <p>Design Flow could not load tickets.</p>
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <p className={styles.resultCount}>
            {list.data.totalCount}{' '}
            {list.data.totalCount === 1 ? 'ticket' : 'tickets'}
          </p>
          <DataTable
            caption="All Tickets results"
            columns={columns}
            rows={list.data.rows}
            getRowKey={(row) => row.id}
            onRowActivate={(row) => navigate(`/work-items/${row.displayId}`)}
            getRowAriaLabel={(row) => `Open ${row.displayId}: ${row.title}`}
            renderMobileCard={(row) => (
              <article className={styles.ticketCard}>
                <div>
                  <Link to={`/work-items/${row.displayId}`}>
                    {row.displayId}
                  </Link>
                  <h2>{row.title}</h2>
                </div>
                <div className={styles.indicators}>
                  <Badge tone={statusTones[row.status.code] ?? 'neutral'}>
                    {row.status.label}
                  </Badge>
                  {row.isBlocked ? <Badge tone="blocked">Blocked</Badge> : null}
                  {row.isArchived ? (
                    <Badge tone="archived">Archived</Badge>
                  ) : null}
                </div>
                <dl>
                  <div>
                    <dt>Area / Squad</dt>
                    <dd>{row.area.name}</dd>
                  </div>
                  <div>
                    <dt>Assignee</dt>
                    <dd>{row.assignee?.displayName ?? 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt>Contributors</dt>
                    <dd>
                      {row.contributors.length ? (
                        <Popover
                          label={`Contributors to ${row.displayId}`}
                          trigger={
                            <Button size="small" variant="ghost">
                              {row.contributors.length} contributors
                            </Button>
                          }
                        >
                          <ul className={styles.simpleList}>
                            {row.contributors.map((person) => (
                              <li key={person.id}>{person.displayName}</li>
                            ))}
                          </ul>
                        </Popover>
                      ) : (
                        'None'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{date(row.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>Subtasks</dt>
                    <dd>
                      {row.completedSubtasks}/{row.totalSubtasks}
                    </dd>
                  </div>
                </dl>
                {row.figmaUrl ? (
                  <a
                    href={row.figmaUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${row.displayId} in Figma (opens in a new tab)`}
                  >
                    Open Figma ↗
                  </a>
                ) : null}
              </article>
            )}
            emptyContent={
              noResults ? (
                <div>
                  <p>No tickets match these filters.</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchDraft('');
                      setParams(new URLSearchParams());
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <p>No tickets are available in this view.</p>
              )
            }
          />
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            totalCount={list.data.totalCount}
            onPageChange={(page) => update({ page })}
            label="Ticket result pages"
          />
        </>
      )}
    </div>
  );
}
