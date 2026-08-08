import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { createOperationId } from '../../shared/operations/operationId';
import { Button as ModernButton } from '../../ui/primitives/button';
import { WorkflowOverlay } from '../../ui/WorkflowOverlay/WorkflowOverlay';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import { useAuthentication } from '../auth/authContext';
import { WorkItemForm } from '../work-items/WorkItemForm';
import {
  createWorkItem,
  getWorkItemDetail,
  getWorkItemOptions,
  listWorkItems,
  setSubtaskCompletion,
  transitionWorkItem,
} from '../work-items/workItemsApi';
import type {
  WorkItemFormValues,
  WorkItemListRow,
} from '../work-items/workItemTypes';
import {
  submitWorkLog,
  type WorkLogContext,
  type WorkLogEntryInput,
} from './workLogsApi';
import styles from './WorkLogPage.module.css';

const ticketTypes = [
  ['planning_alignment', 'Planning & alignment'],
  ['discovery_research', 'Discovery & research'],
  ['mapping_information_architecture', 'Mapping & information architecture'],
  ['ideation_wireframing', 'Ideation & wireframing'],
  ['ui_visual_design', 'UI & visual design'],
  ['prototyping_interaction', 'Prototyping & interaction'],
  ['design_system', 'Design system'],
  ['testing_validation', 'Testing & validation'],
  ['review_iteration', 'Review & iteration'],
  ['documentation_handoff', 'Documentation & handoff'],
  ['design_qa_implementation_support', 'Design QA & implementation support'],
  ['team_support_collaboration', 'Team support & collaboration'],
  ['other', 'Other'],
] as const;
const visualTypes = [
  ['new_visual_asset', 'New visual asset'],
  ['resizing_adaptation', 'Resizing & adaptation'],
  ['presentation_support', 'Presentation support'],
  ['image_editing', 'Image editing'],
  ['illustration_iconography', 'Illustration & iconography'],
  ['other_visual_work', 'Other visual work'],
] as const;
const today = new Date().toISOString().slice(0, 10);
const newEntry = (): WorkLogEntryInput => ({
  workDate: today,
  workTypeCode: '',
  description: '',
});
const blankTicket = (assigneeId = ''): WorkItemFormValues => ({
  title: '',
  description: '',
  areaId: '',
  assigneeId,
  plannedStartDate: '',
  dueDate: '',
  figmaUrl: '',
  labelIds: [],
});

interface FollowupFailures {
  status: boolean;
  subtasks: { id: string; title: string }[];
}

export function WorkLogPage() {
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [view, setView] = useState<'log' | 'create'>('log');
  const [context, setContext] = useState<WorkLogContext>('ticket');
  const [ticketId, setTicketId] = useState(params.get('workItemId') ?? '');
  const [ticketDisplayId, setTicketDisplayId] = useState('');
  const [workedBy, setWorkedBy] = useState(account?.id ?? '');
  const [entries, setEntries] = useState<WorkLogEntryInput[]>([newEntry()]);
  const [targetStatus, setTargetStatus] = useState('');
  const [addBlocker, setAddBlocker] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerDate, setBlockerDate] = useState('');
  const [selectedSubtasks, setSelectedSubtasks] = useState<string[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [createDraft, setCreateDraft] = useState<WorkItemFormValues | null>(
    null,
  );
  const [createOperation, setCreateOperation] = useState(createOperationId);
  const [failures, setFailures] = useState<FollowupFailures | null>(null);
  const [logSucceeded, setLogSucceeded] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const logOperation = useRef(createOperationId());
  const statusOperation = useRef(createOperationId());
  const subtaskOperations = useRef(new Map<string, string>());

  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const tickets = useQuery({
    queryKey: ['work-log-tickets'],
    queryFn: () =>
      listWorkItems({
        view: 'all',
        search: '',
        peopleIds: [],
        relationship: '',
        statusCodes: [],
        areaIds: [],
        labelIds: [],
        blocked: '',
        due: '',
        stale: '',
        sort: 'display_id',
        direction: 'asc',
        page: 1,
      }),
  });
  const row = tickets.data?.rows.find((item) => item.id === ticketId);
  const effectiveDisplayId = ticketDisplayId || (row?.displayId ?? '');
  const selectedTicket = useQuery({
    queryKey: ['work-log-ticket', effectiveDisplayId],
    queryFn: () => getWorkItemDetail(effectiveDisplayId),
    enabled: Boolean(effectiveDisplayId),
  });
  const submitMutation = useMutation({ mutationFn: submitWorkLog });
  const createMutation = useMutation({
    mutationFn: (values: WorkItemFormValues) =>
      createWorkItem(values, createOperation),
  });
  const filteredTickets = useMemo(() => {
    const search = ticketSearch.trim().toLowerCase();
    const rows = tickets.data?.rows ?? [];
    return (
      search
        ? rows.filter((item) =>
            `${item.displayId} ${item.title} ${item.status.label} ${item.assignee?.displayName ?? ''}`
              .toLowerCase()
              .includes(search),
          )
        : rows
    ).slice(0, 8);
  }, [ticketSearch, tickets.data?.rows]);
  const canChoosePerson = Boolean(
    account &&
    (account.isAdmin || ['lead', 'manager'].includes(account.positionCode)),
  );
  const canCreateTicket = account?.positionCode !== 'viewer';
  const types = context === 'ticket' ? ticketTypes : visualTypes;
  const incompleteSubtasks =
    selectedTicket.data?.subtasks.filter((subtask) => !subtask.isCompleted) ??
    [];
  const defaultCreate = useMemo(
    () =>
      blankTicket(
        options.data?.people.some((person) => person.id === account?.id)
          ? account?.id
          : '',
      ),
    [account?.id, options.data?.people],
  );
  const isValid = Boolean(
    entries.length &&
    entries.every(
      (entry) =>
        entry.workDate && entry.workDate <= today && entry.workTypeCode,
    ) &&
    (context !== 'ticket' || ticketId) &&
    (!addBlocker || blockerReason.trim()),
  );
  const isDirty =
    context !== 'ticket' ||
    ticketId !== (params.get('workItemId') ?? '') ||
    workedBy !== (account?.id ?? '') ||
    entries.length !== 1 ||
    Boolean(entries[0]?.workTypeCode) ||
    Boolean(entries[0]?.description) ||
    entries[0]?.workDate !== today ||
    targetStatus ||
    addBlocker ||
    selectedSubtasks.length > 0;
  const createDirty =
    createDraft !== null &&
    JSON.stringify(createDraft) !== JSON.stringify(defaultCreate);

  const dismiss = () => {
    if (location.key === 'default')
      void navigate('/work-items', { replace: true });
    else void navigate(-1);
  };
  const refreshTicket = async () => {
    if (!effectiveDisplayId) return null;
    await queryClient.invalidateQueries({
      queryKey: ['work-log-ticket', effectiveDisplayId],
    });
    return getWorkItemDetail(effectiveDisplayId);
  };
  const finish = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work-items'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ]);
    void navigate(
      context === 'ticket' && effectiveDisplayId
        ? `/work-items/${effectiveDisplayId}`
        : '/work-items',
      {
        replace: true,
        state: { confirmation: announcement || 'Work logged.' },
      },
    );
  };
  const runFollowups = async (onlyFailures?: FollowupFailures) => {
    let current = await refreshTicket();
    const next: FollowupFailures = { status: false, subtasks: [] };
    const shouldStatus = onlyFailures
      ? onlyFailures.status
      : Boolean(targetStatus);
    if (
      shouldStatus &&
      targetStatus &&
      current &&
      targetStatus !== current.status.code
    ) {
      if (current.capabilities.canTransition) {
        try {
          await transitionWorkItem(
            current,
            targetStatus,
            false,
            statusOperation.current,
          );
          current = await refreshTicket();
        } catch {
          next.status = true;
          current = await refreshTicket();
        }
      } else next.status = true;
    }
    const intended = onlyFailures
      ? onlyFailures.subtasks.map((item) => item.id)
      : selectedSubtasks;
    for (const id of intended) {
      const subtask = current?.subtasks.find((item) => item.id === id);
      if (!subtask || subtask.isCompleted) continue;
      const operationId =
        subtaskOperations.current.get(id) ?? createOperationId();
      subtaskOperations.current.set(id, operationId);
      if (!current?.capabilities.canEditSubtasks) {
        next.subtasks.push({ id, title: subtask.title });
        continue;
      }
      try {
        await setSubtaskCompletion(id, true, false, operationId);
        current = await refreshTicket();
      } catch {
        next.subtasks.push({ id, title: subtask.title });
        current = await refreshTicket();
      }
    }
    if (next.status || next.subtasks.length) {
      setFailures(next);
      setAnnouncement(
        `Work was logged. ${next.status ? 'Status change failed. ' : ''}${next.subtasks.length ? `Subtasks not completed: ${next.subtasks.map((item) => item.title).join(', ')}.` : ''}`,
      );
      return;
    }
    setFailures(null);
    setAnnouncement(
      'Work logged and all selected ticket follow-ups completed.',
    );
    await finish();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account || !isValid || logSucceeded) return;
    try {
      await submitMutation.mutateAsync({
        context,
        workItemId: context === 'ticket' ? ticketId : null,
        relatedAreaId: null,
        workedBy: canChoosePerson ? workedBy : account.id,
        entries,
        blocker:
          context === 'ticket' && addBlocker
            ? { reason: blockerReason, expectedResolutionDate: blockerDate }
            : null,
        operationId: logOperation.current,
      });
      setLogSucceeded(true);
      setAnnouncement('Work logged. Completing selected follow-ups…');
      if (context === 'ticket') await runFollowups();
      else {
        setAnnouncement('Standalone visual work logged.');
        await finish();
      }
    } catch {
      setAnnouncement(
        'Work could not be logged. No ticket follow-up was attempted; your draft is preserved.',
      );
    }
  };

  if (account?.positionCode === 'viewer')
    return (
      <main className={styles.page}>
        <h1>Log work</h1>
        <div className={styles.state} role="status">
          <p>Viewers can review recorded work but cannot log or edit work.</p>
          <Link to="/work-items">Return to Work Items</Link>
        </div>
      </main>
    );

  if (view === 'create') {
    const values = createDraft ?? defaultCreate;
    return (
      <WorkflowOverlay
        title="Create ticket"
        description="Create a Backlog ticket, then return to the preserved Log Work draft."
        isDirty={Boolean(isDirty || createDirty)}
        isBusy={createMutation.isPending}
        onDismiss={dismiss}
        onBack={() => setView('log')}
        backLabel="Back to Log work"
        footer={
          <ModernButton
            className="h-12 w-full rounded-xl text-base"
            type="submit"
            form="nested-create-ticket-form"
            disabled={
              !values.title.trim() || !values.areaId || options.isPending
            }
            isLoading={createMutation.isPending}
          >
            Create ticket
          </ModernButton>
        }
      >
        {options.isPending ? <p role="status">Loading ticket fields…</p> : null}
        {options.isError ? (
          <div role="alert">
            <p>Ticket fields could not be loaded.</p>
            <Button variant="secondary" onClick={() => void options.refetch()}>
              Retry
            </Button>
          </div>
        ) : null}
        {options.data ? (
          <WorkItemForm
            formId="nested-create-ticket-form"
            hideSubmitButton
            showCreationStatus={false}
            options={options.data}
            initialValues={values}
            submitLabel="Create ticket"
            isSubmitting={createMutation.isPending}
            serverError={
              createMutation.isError
                ? 'The ticket was not created. These values and your Log Work draft are preserved.'
                : undefined
            }
            onValuesChange={(next) => {
              setCreateDraft(next);
              if (createMutation.isError) {
                createMutation.reset();
                setCreateOperation(createOperationId());
              }
            }}
            onSubmit={(next) =>
              createMutation.mutate(next, {
                onSuccess: (result) => {
                  setTicketId(result.id);
                  setTicketDisplayId(result.display_id);
                  setTicketSearch('');
                  setView('log');
                  setAnnouncement(
                    `${result.display_id} created in Backlog and selected. Finish the work log when ready.`,
                  );
                },
              })
            }
          />
        ) : null}
      </WorkflowOverlay>
    );
  }

  return (
    <WorkflowOverlay
      title="Log work"
      description="Record one to five actual work dates and optional independent ticket follow-ups."
      isDirty={Boolean(isDirty)}
      isBusy={submitMutation.isPending}
      onDismiss={dismiss}
      footer={
        failures ? (
          <ModernButton
            className="h-12 w-full rounded-xl text-base"
            onClick={() => void runFollowups(failures)}
          >
            Retry failed follow-ups
          </ModernButton>
        ) : (
          <ModernButton
            className="h-12 w-full rounded-xl text-base"
            type="submit"
            form="log-work-form"
            disabled={!isValid || logSucceeded}
            isLoading={submitMutation.isPending}
          >
            Log work
          </ModernButton>
        )
      }
    >
      <form
        id="log-work-form"
        className={styles.overlayForm}
        onSubmit={submit}
        noValidate
      >
        <div
          className={styles.segmented}
          role="group"
          aria-label="Work context"
        >
          <Button
            type="button"
            variant={context === 'ticket' ? 'primary' : 'secondary'}
            aria-pressed={context === 'ticket'}
            onClick={() => setContext('ticket')}
          >
            Ticket work
          </Button>
          <Button
            type="button"
            variant={context === 'standalone_visual' ? 'primary' : 'secondary'}
            aria-pressed={context === 'standalone_visual'}
            onClick={() => {
              setContext('standalone_visual');
              setTicketId('');
              setTicketDisplayId('');
              setTargetStatus('');
              setSelectedSubtasks([]);
              setAddBlocker(false);
            }}
          >
            Standalone Visual Work
          </Button>
        </div>
        {context === 'ticket' ? (
          <section
            className={styles.ticketPicker}
            aria-labelledby="ticket-picker-title"
          >
            <h2 id="ticket-picker-title">Work Item</h2>
            <div className={styles.searchRow}>
              <span aria-hidden="true">
                <Search />
              </span>
              <input
                aria-label="Search tickets"
                value={ticketSearch}
                onChange={(event) => setTicketSearch(event.target.value)}
                placeholder="Search tickets"
              />
              {canCreateTicket ? (
                <ModernButton
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-12 border-l border-border rounded-none"
                  aria-label="Create new ticket"
                  title="Create new ticket"
                  onClick={() => setView('create')}
                >
                  <Plus aria-hidden="true" />
                </ModernButton>
              ) : null}
            </div>
            {tickets.isPending ? <p role="status">Loading tickets…</p> : null}
            {tickets.isError ? (
              <p role="alert">Tickets could not be loaded.</p>
            ) : null}
            {!tickets.isPending && !filteredTickets.length ? (
              <p>No unarchived ticket matches this search.</p>
            ) : null}
            {ticketSearch ? (
              <div className={styles.ticketResults} aria-label="Ticket results">
                {filteredTickets.map((item: WorkItemListRow) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant={item.id === ticketId ? 'primary' : 'secondary'}
                    aria-pressed={item.id === ticketId}
                    onClick={() => {
                      setTicketId(item.id);
                      setTicketDisplayId(item.displayId);
                      setTicketSearch('');
                      setSelectedSubtasks([]);
                    }}
                  >
                    {item.displayId} — {item.title} · {item.status.label} ·{' '}
                    {item.assignee?.displayName ?? 'Unassigned'}
                  </Button>
                ))}
              </div>
            ) : null}
            {effectiveDisplayId ? (
              <p role="status">
                Selected: {effectiveDisplayId} —{' '}
                {selectedTicket.data?.title ?? row?.title ?? 'Loading…'}
              </p>
            ) : (
              <p>Select a ticket before logging work.</p>
            )}
          </section>
        ) : (
          <p>
            Standalone visual work is not attached to a ticket or its lifecycle.
          </p>
        )}
        {canChoosePerson ? (
          <Select
            label="Worked by"
            value={workedBy}
            onChange={(event) => setWorkedBy(event.target.value)}
          >
            {options.data?.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </Select>
        ) : null}
        <fieldset className={styles.dateRows}>
          <legend>Work Date(s)</legend>
          {entries.map((entry, index) => (
            <div className={styles.dateRow} key={index}>
              <Input
                label={`Work date ${index + 1}`}
                type="date"
                max={today}
                required
                value={entry.workDate}
                {...(entry.workDate > today
                  ? { error: 'Future dates are not allowed.' }
                  : {})}
                onChange={(event) =>
                  setEntries(
                    entries.map((value, i) =>
                      i === index
                        ? { ...value, workDate: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              <Select
                label={`Work type ${index + 1}`}
                required
                value={entry.workTypeCode}
                onChange={(event) =>
                  setEntries(
                    entries.map((value, i) =>
                      i === index
                        ? { ...value, workTypeCode: event.target.value }
                        : value,
                    ),
                  )
                }
              >
                <option value="">Select work type</option>
                {types.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Textarea
                label={`Description ${index + 1} (optional)`}
                rows={2}
                value={entry.description}
                onChange={(event) =>
                  setEntries(
                    entries.map((value, i) =>
                      i === index
                        ? { ...value, description: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              {index > 0 ? (
                <ModernButton
                  type="button"
                  variant="ghost"
                  aria-label={`Remove work date ${index + 1}`}
                  onClick={() =>
                    setEntries(entries.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 aria-hidden="true" /> Remove date
                </ModernButton>
              ) : null}
              <p className={styles.help}>
                Friday and Saturday may be entered manually when work occurred.
              </p>
            </div>
          ))}
          <ModernButton
            type="button"
            variant="secondary"
            disabled={entries.length >= 5}
            onClick={() => setEntries([...entries, newEntry()])}
          >
            <Plus aria-hidden="true" /> Add another date
          </ModernButton>
        </fieldset>
        {context === 'ticket' ? (
          <details className={styles.followups}>
            <summary>Show more options</summary>
            {selectedTicket.data?.capabilities.canTransition ? (
              <Select
                label="Optional status change"
                value={targetStatus}
                onChange={(event) => {
                  setTargetStatus(event.target.value);
                  statusOperation.current = createOperationId();
                }}
              >
                <option value="">Keep current status</option>
                {options.data?.statuses.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </Select>
            ) : null}
            <Checkbox
              label="Add a blocker with this work log"
              checked={addBlocker}
              onChange={(event) => setAddBlocker(event.target.checked)}
            />
            {addBlocker ? (
              <>
                <Textarea
                  label="Blocker reason"
                  required
                  value={blockerReason}
                  onChange={(event) => setBlockerReason(event.target.value)}
                />
                <Input
                  label="Expected resolution date (optional)"
                  type="date"
                  value={blockerDate}
                  onChange={(event) => setBlockerDate(event.target.value)}
                />
              </>
            ) : null}
            {incompleteSubtasks.length &&
            selectedTicket.data?.capabilities.canEditSubtasks ? (
              <fieldset className={styles.subtasks}>
                <legend>Complete subtasks</legend>
                {incompleteSubtasks.map((subtask) => (
                  <Checkbox
                    key={subtask.id}
                    label={subtask.title}
                    checked={selectedSubtasks.includes(subtask.id)}
                    onChange={(event) =>
                      setSelectedSubtasks(
                        event.target.checked
                          ? [...selectedSubtasks, subtask.id]
                          : selectedSubtasks.filter((id) => id !== subtask.id),
                      )
                    }
                  />
                ))}
              </fieldset>
            ) : null}
          </details>
        ) : null}
        {announcement ? (
          <p
            className={
              failures || submitMutation.isError
                ? styles.error
                : styles.feedback
            }
            role={failures || submitMutation.isError ? 'alert' : 'status'}
          >
            {announcement}
          </p>
        ) : null}
      </form>
    </WorkflowOverlay>
  );
}
