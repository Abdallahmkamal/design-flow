import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { DataTable, type DataTableColumn } from '../../ui/DataTable/DataTable';
import { Input } from '../../ui/Input/Input';
import {
  archiveControlledValue,
  createControlledValue,
  getControlledValues,
  reactivateControlledValue,
  renameControlledValue,
  reorderControlledValues,
  type ControlledValueRecord,
} from './settingsApi';
import {
  operationIdFor,
  announceSettingsSaved,
  settingsErrorMessage,
  type StableOperation,
} from './settingsUi';
import styles from './SettingsPage.module.css';

type ControlledKind = 'workArea' | 'label';

interface ControlledListSectionProps {
  kind: ControlledKind;
}

type ControlledAction =
  | { type: 'create'; name: string; id: string }
  | { type: 'rename'; value: ControlledValueRecord; name: string }
  | { type: 'reorder'; orderedIds: string[] }
  | { type: 'archive'; value: ControlledValueRecord }
  | { type: 'reactivate'; value: ControlledValueRecord };

export function ControlledListSection({ kind }: ControlledListSectionProps) {
  const queryClient = useQueryClient();
  const label = kind === 'workArea' ? 'Area/Squad' : 'Label';
  const pluralLabel = kind === 'workArea' ? 'Areas/Squads' : 'Labels';
  const sectionId = kind === 'workArea' ? 'areas' : 'labels';
  const [createName, setCreateName] = useState('');
  const [renaming, setRenaming] = useState<ControlledValueRecord | null>(null);
  const [renameName, setRenameName] = useState('');
  const [archiving, setArchiving] = useState<ControlledValueRecord | null>(
    null,
  );
  const operation = useRef<StableOperation | null>(null);
  const pendingCreate = useRef<{ id: string; name: string } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const confirmation = useRef<HTMLElement | null>(null);
  const valuesQuery = useQuery({
    queryKey: ['settings-controlled-values', kind],
    queryFn: () => getControlledValues(kind),
  });
  const action = useMutation({
    mutationFn: async (nextAction: ControlledAction) => {
      const key = JSON.stringify(nextAction);
      const operationId = operationIdFor(operation, key);

      switch (nextAction.type) {
        case 'create':
          return await createControlledValue(
            kind,
            nextAction.id,
            nextAction.name,
            operationId,
          );
        case 'rename':
          return await renameControlledValue(
            kind,
            nextAction.value,
            nextAction.name,
            operationId,
          );
        case 'reorder':
          return await reorderControlledValues(
            kind,
            nextAction.orderedIds,
            operationId,
          );
        case 'archive':
          return await archiveControlledValue(
            kind,
            nextAction.value,
            operationId,
          );
        case 'reactivate':
          return await reactivateControlledValue(
            kind,
            nextAction.value,
            operationId,
          );
      }
    },
    onSuccess: async (_data, completedAction) => {
      announceSettingsSaved();
      operation.current = null;
      if (completedAction.type === 'create') {
        pendingCreate.current = null;
      }
      setCreateName('');
      setRenaming(null);
      setArchiving(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['settings-controlled-values', kind],
        }),
        queryClient.invalidateQueries({ queryKey: ['settings-audit'] }),
      ]);
      if (
        completedAction.type === 'rename' ||
        completedAction.type === 'archive'
      ) {
        requestAnimationFrame(() => returnFocus.current?.focus());
      }
    },
  });

  const openConfirmation = (
    type: 'rename' | 'archive',
    value: ControlledValueRecord,
  ) => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (type === 'rename') {
      setRenameName(value.name);
      setRenaming(value);
      setArchiving(null);
    } else {
      setArchiving(value);
      setRenaming(null);
    }
  };

  const closeConfirmation = () => {
    setRenaming(null);
    setArchiving(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  };

  useEffect(() => {
    if (renaming || archiving) {
      confirmation.current
        ?.querySelector<HTMLElement>('h3')
        ?.focus({ preventScroll: true });
      confirmation.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [archiving, renaming]);

  const values = valuesQuery.data ?? [];
  const activeValues = values
    .filter((value) => value.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const archivedValues = values.filter((value) => !value.isActive);

  const move = (value: ControlledValueRecord, direction: -1 | 1) => {
    const index = activeValues.findIndex(
      (candidate) => candidate.id === value.id,
    );
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= activeValues.length) {
      return;
    }
    const reordered = [...activeValues];
    const [selected] = reordered.splice(index, 1);
    if (!selected) return;
    reordered.splice(targetIndex, 0, selected);
    action.mutate({
      type: 'reorder',
      orderedIds: reordered.map((candidate) => candidate.id),
    });
  };

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = createName.trim();
    if (!name) return;
    if (pendingCreate.current?.name !== name) {
      pendingCreate.current = { name, id: crypto.randomUUID() };
    }
    action.mutate({
      type: 'create',
      name,
      id: pendingCreate.current.id,
    });
  };

  const columns: readonly DataTableColumn<ControlledValueRecord>[] = [
    {
      key: 'name',
      header: label,
      render: (value) => <strong>{value.name}</strong>,
    },
    {
      key: 'state',
      header: 'State',
      render: (value) => (
        <Badge tone={value.isActive ? 'success' : 'neutral'}>
          {value.isActive ? 'Active' : 'Archived'}
        </Badge>
      ),
    },
    {
      key: 'usage',
      header: 'Ticket usage',
      render: (value) =>
        `${value.currentUsageCount} current · ${value.historicalUsageCount} historical`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value) => (
        <div className={styles.rowActions}>
          {value.isActive ? (
            <>
              <Button
                variant="ghost"
                size="small"
                disabled={
                  action.isPending ||
                  activeValues.findIndex(
                    (candidate) => candidate.id === value.id,
                  ) === 0
                }
                onClick={() => move(value, -1)}
              >
                Move up
              </Button>
              <Button
                variant="ghost"
                size="small"
                disabled={
                  action.isPending ||
                  activeValues.findIndex(
                    (candidate) => candidate.id === value.id,
                  ) ===
                    activeValues.length - 1
                }
                onClick={() => move(value, 1)}
              >
                Move down
              </Button>
              <Button
                variant="ghost"
                size="small"
                disabled={action.isPending}
                onClick={() => openConfirmation('rename', value)}
              >
                Rename
              </Button>
              <Button
                variant="ghost"
                size="small"
                disabled={action.isPending}
                onClick={() => openConfirmation('archive', value)}
              >
                Archive
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="small"
              disabled={action.isPending}
              onClick={() => action.mutate({ type: 'reactivate', value })}
            >
              Reactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section
      className={styles.section}
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
    >
      <header className={styles.sectionHeader}>
        <div>
          <h2 id={`${sectionId}-title`}>{pluralLabel}</h2>
          <p>
            Active values are available for new tickets. Archived values stay
            attached to history.
          </p>
        </div>
      </header>

      <form className={styles.inlineForm} onSubmit={submitCreate}>
        <Input
          label={`New ${label} name`}
          value={createName}
          onChange={(event) => setCreateName(event.target.value)}
          required
        />
        <Button type="submit" isLoading={action.isPending}>
          Create {label}
        </Button>
      </form>

      {action.isError ? (
        <p className={styles.error} role="alert">
          {settingsErrorMessage(action.error)}
        </p>
      ) : null}

      {renaming ? (
        <form
          className={styles.confirmation}
          ref={(node) => {
            confirmation.current = node;
          }}
          onSubmit={(event) => {
            event.preventDefault();
            if (renameName.trim()) {
              action.mutate({
                type: 'rename',
                value: renaming,
                name: renameName.trim(),
              });
            }
          }}
        >
          <h3 tabIndex={-1}>Rename {renaming.name}</h3>
          <Input
            label={`Updated ${label} name`}
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            required
          />
          <div className={styles.formActions}>
            <Button type="submit" isLoading={action.isPending}>
              Save name
            </Button>
            <Button
              variant="ghost"
              onClick={closeConfirmation}
              disabled={action.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {archiving ? (
        <div
          className={styles.confirmation}
          ref={(node) => {
            confirmation.current = node;
          }}
        >
          <h3 tabIndex={-1}>Archive {archiving.name}?</h3>
          <p>
            It is used by {archiving.currentUsageCount} current and{' '}
            {archiving.historicalUsageCount} historical tickets. Existing
            references remain visible.
          </p>
          <div className={styles.formActions}>
            <Button
              variant="destructive"
              isLoading={action.isPending}
              onClick={() =>
                action.mutate({ type: 'archive', value: archiving })
              }
            >
              Confirm archive
            </Button>
            <Button
              variant="ghost"
              onClick={closeConfirmation}
              disabled={action.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {valuesQuery.isPending ? (
        <p className={styles.scopedState} role="status">
          Loading {pluralLabel}…
        </p>
      ) : valuesQuery.isError ? (
        <div className={styles.scopedState} role="alert">
          <p>Design Flow could not load {pluralLabel}.</p>
          <Button
            variant="secondary"
            onClick={() => void valuesQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            caption={`Active ${pluralLabel}`}
            columns={columns}
            rows={activeValues}
            getRowKey={(value) => value.id}
            emptyContent={<p>No active {pluralLabel.toLowerCase()}.</p>}
          />
          {archivedValues.length > 0 ? (
            <details className={styles.archived}>
              <summary>
                Archived {pluralLabel} ({archivedValues.length})
              </summary>
              <DataTable
                caption={`Archived ${pluralLabel}`}
                columns={columns}
                rows={archivedValues}
                getRowKey={(value) => value.id}
              />
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
