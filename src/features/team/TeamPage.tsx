import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Badge } from '../../ui/Badge/Badge';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Button } from '../../ui/Button/Button';
import { getTeamDirectory, type TeamMember } from './teamApi';
import styles from './TeamPage.module.css';

const columns: readonly DataTableColumn<TeamMember>[] = [
  {
    key: 'person',
    header: 'Person',
    render: (member) => <strong>{member.displayName}</strong>,
  },
  {
    key: 'position',
    header: 'Position',
    render: (member) => member.positionLabel,
  },
  {
    key: 'admin',
    header: 'Access',
    render: (member) =>
      member.isAdmin ? <Badge tone="info">Admin</Badge> : 'Member',
  },
  {
    key: 'reports-to',
    header: 'Reports to',
    render: (member) => member.reportsToDisplayName ?? '—',
  },
];

export function TeamPage() {
  const { account } = useAuthentication();
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('all');
  const directory = useQuery({
    queryKey: ['team-directory'],
    queryFn: getTeamDirectory,
  });

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return (directory.data ?? []).filter(
      (member) =>
        (position === 'all' || member.positionCode === position) &&
        (!normalizedSearch ||
          member.displayName.toLocaleLowerCase().includes(normalizedSearch) ||
          member.reportsToDisplayName
            ?.toLocaleLowerCase()
            .includes(normalizedSearch)),
    );
  }, [directory.data, position, search]);

  const hasFilters = Boolean(search.trim()) || position !== 'all';

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>People and reporting structure</p>
          <h1>Team</h1>
          <p className={styles.summary}>
            Active people, organizational positions, Admin access, and current
            reporting relationships.
          </p>
        </div>
        {account?.isAdmin ? (
          <Link className={styles.settingsLink} to="/settings">
            Open Settings
          </Link>
        ) : null}
      </header>

      <form
        className={styles.filters}
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          label="Search team"
          placeholder="Name or supervisor"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Position"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
        >
          <option value="all">All positions</option>
          <option value="viewer">Viewer</option>
          <option value="designer">Designer</option>
          <option value="lead">Lead</option>
          <option value="manager">Manager</option>
        </Select>
      </form>

      {directory.isPending ? (
        <div className={styles.state} role="status">
          Loading Team directory…
        </div>
      ) : directory.isError ? (
        <div className={styles.state} role="alert">
          <p>Design Flow could not load the Team directory.</p>
          <Button variant="secondary" onClick={() => void directory.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          caption="Active Team directory"
          columns={columns}
          rows={filteredMembers}
          getRowKey={(member) => member.id}
          emptyContent={
            hasFilters ? (
              <div className={styles.empty}>
                <p>No active people match these filters.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setPosition('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <p>No active people are available. Contact a portal Admin.</p>
            )
          }
        />
      )}
    </div>
  );
}
