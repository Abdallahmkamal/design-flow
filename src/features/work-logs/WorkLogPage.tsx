import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import {
  getWorkItemDetail,
  getWorkItemOptions,
  listWorkItems,
  transitionWorkItem,
} from '../work-items/workItemsApi';
import { type WorkItemListRow } from '../work-items/workItemTypes';
import { submitWorkLog, type WorkLogContext } from './workLogsApi';
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
const draftKey = 'design-flow:log-work-draft';

function storedDraft() {
  try {
    const value = sessionStorage.getItem(draftKey);
    return value
      ? (JSON.parse(value) as {
          context: WorkLogContext;
          workedBy: string;
          entries: {
            workDate: string;
            workTypeCode: string;
            description: string;
          }[];
          targetStatus: string;
          addBlocker: boolean;
          blockerReason: string;
          blockerDate: string;
        })
      : null;
  } catch {
    return null;
  }
}

export function WorkLogPage() {
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialDraft = storedDraft();
  const [context, setContext] = useState<WorkLogContext>(
    initialDraft?.context ?? 'ticket',
  );
  const [ticketId, setTicketId] = useState(params.get('workItemId') ?? '');
  const [workedBy, setWorkedBy] = useState(
    initialDraft?.workedBy ?? account?.id ?? '',
  );
  const [targetStatus, setTargetStatus] = useState(
    initialDraft?.targetStatus ?? '',
  );
  const [statusError, setStatusError] = useState(false);
  const [addBlocker, setAddBlocker] = useState(
    initialDraft?.addBlocker ?? false,
  );
  const [blockerReason, setBlockerReason] = useState(
    initialDraft?.blockerReason ?? '',
  );
  const [blockerDate, setBlockerDate] = useState(
    initialDraft?.blockerDate ?? '',
  );
  const [ticketSearch, setTicketSearch] = useState('');
  const [entries, setEntries] = useState(
    initialDraft?.entries?.length
      ? initialDraft.entries
      : [{ workDate: today, workTypeCode: '', description: '' }],
  );
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
  const mutation = useMutation({ mutationFn: submitWorkLog });
  const filteredTickets = useMemo(() => {
    const search = ticketSearch.trim().toLowerCase();
    if (!search) return tickets.data?.rows.slice(0, 8) ?? [];
    return (tickets.data?.rows ?? []).filter((ticket) =>
      `${ticket.displayId} ${ticket.title} ${ticket.status.label} ${ticket.assignee?.displayName ?? ''}`
        .toLowerCase()
        .includes(search),
    );
  }, [ticketSearch, tickets.data?.rows]);
  const selectedTicket = useQuery({
    queryKey: ['work-log-ticket', ticketId],
    queryFn: async () => {
      const row = tickets.data?.rows.find((ticket) => ticket.id === ticketId);
      return row ? getWorkItemDetail(row.displayId) : null;
    },
    enabled: Boolean(ticketId && tickets.data),
  });
  const types = context === 'ticket' ? ticketTypes : visualTypes;
  const canChoosePerson = Boolean(
    account &&
    (account.isAdmin || ['lead', 'manager'].includes(account.positionCode)),
  );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account || (context === 'ticket' && !ticketId)) return;
    try {
      const result = await mutation.mutateAsync({
        context,
        workItemId: context === 'ticket' ? ticketId : null,
        relatedAreaId: null,
        workedBy: canChoosePerson ? workedBy : account.id,
        entries,
        blocker:
          context === 'ticket' && addBlocker
            ? { reason: blockerReason, expectedResolutionDate: blockerDate }
            : null,
      });
      sessionStorage.removeItem(draftKey);
      await queryClient.invalidateQueries({ queryKey: ['work-items'] });
      if (
        targetStatus &&
        selectedTicket.data &&
        targetStatus !== selectedTicket.data.status.code
      ) {
        try {
          await transitionWorkItem(selectedTicket.data, targetStatus);
        } catch {
          setStatusError(true);
          return;
        }
      }
      void navigate(
        context === 'ticket'
          ? `/work-items/${tickets.data?.rows.find((ticket) => ticket.id === ticketId)?.displayId ?? ''}`
          : '/work-logs/new',
        { replace: context === 'ticket' },
      );
      if (context === 'standalone_visual')
        alert(`Visual work logged (${result.id}).`);
    } catch {
      /* rendered below without losing draft */
    }
  };
  const queryClient = useQueryClient();
  const retryStatus = async () => {
    if (!selectedTicket.data || !targetStatus) return;
    setStatusError(false);
    try {
      await transitionWorkItem(selectedTicket.data, targetStatus);
      void navigate(`/work-items/${selectedTicket.data.displayId}`, {
        replace: true,
      });
    } catch {
      setStatusError(true);
    }
  };
  return (
    <main className={styles.page}>
      <header>
        <Link to="/work-items">All Tickets</Link>
        <h1>Log Work</h1>
        <p>
          Record actual work dates. Planned dates and submission timestamps
          remain separate.
        </p>
      </header>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.actions}>
          <Button
            type="button"
            variant={context === 'ticket' ? 'primary' : 'secondary'}
            onClick={() => setContext('ticket')}
          >
            Ticket work
          </Button>
          <Button
            type="button"
            variant={context === 'standalone_visual' ? 'primary' : 'secondary'}
            onClick={() => setContext('standalone_visual')}
          >
            Standalone Visual Work
          </Button>
        </div>
        {context === 'ticket' ? (
          <section
            className={styles.ticketPicker}
            aria-labelledby="ticket-picker-title"
          >
            <h2 id="ticket-picker-title">Work item</h2>
            <Input
              label="Search tickets"
              value={ticketSearch}
              onChange={(event) => setTicketSearch(event.target.value)}
              placeholder="Search ID, title, status, or assignee"
            />
            {tickets.isPending ? <p role="status">Loading tickets…</p> : null}
            {tickets.isError ? (
              <p role="alert">Tickets could not be loaded. Retry the page.</p>
            ) : null}
            {!tickets.isPending &&
            !tickets.isError &&
            filteredTickets.length === 0 ? (
              <p>No unarchived ticket matches this search.</p>
            ) : null}
            <div className={styles.ticketResults} aria-label="Ticket results">
              {filteredTickets.map((ticket: WorkItemListRow) => (
                <Button
                  key={ticket.id}
                  type="button"
                  variant={ticket.id === ticketId ? 'primary' : 'secondary'}
                  onClick={() => setTicketId(ticket.id)}
                  aria-pressed={ticket.id === ticketId}
                >
                  {ticket.displayId} — {ticket.title} · {ticket.status.label} ·{' '}
                  {ticket.assignee?.displayName ?? 'Unassigned'}
                </Button>
              ))}
            </div>
            {ticketId && selectedTicket.data ? (
              <p role="status">
                Selected: {selectedTicket.data.displayId} —{' '}
                {selectedTicket.data.title}
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
        {context === 'ticket' && account?.positionCode !== 'viewer' ? (
          <Link
            to="/work-items/new"
            onClick={() =>
              sessionStorage.setItem(
                draftKey,
                JSON.stringify({
                  context,
                  workedBy,
                  entries,
                  targetStatus,
                  addBlocker,
                  blockerReason,
                  blockerDate,
                }),
              )
            }
          >
            Create New Ticket
          </Link>
        ) : null}
        {context === 'ticket' &&
        selectedTicket.data?.capabilities.canTransition ? (
          <Select
            label="Optional status change"
            value={targetStatus}
            onChange={(event) => setTargetStatus(event.target.value)}
          >
            <option value="">Keep current status</option>
            {options.data?.statuses.map((status) => (
              <option key={status.code} value={status.code}>
                {status.label}
              </option>
            ))}
          </Select>
        ) : null}
        {context === 'ticket' ? (
          <fieldset className={styles.rows}>
            <legend>Optional blocker</legend>
            <Checkbox
              label="Add a blocker with this work log"
              checked={addBlocker}
              onChange={(event) => setAddBlocker(event.target.checked)}
            />
            {addBlocker ? (
              <>
                <Textarea
                  label="Blocker reason"
                  value={blockerReason}
                  required
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
          </fieldset>
        ) : null}
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
        ) : (
          <p>
            Worked by: <strong>{account?.displayName}</strong>
          </p>
        )}
        <fieldset className={styles.rows}>
          <legend>Actual work dates</legend>
          {entries.map((entry, index) => (
            <div className={styles.row} key={index}>
              <Input
                label={`Work date ${index + 1}`}
                type="date"
                max={today}
                value={entry.workDate}
                required
                onChange={(event) =>
                  setEntries(
                    entries.map((value, itemIndex) =>
                      itemIndex === index
                        ? { ...value, workDate: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              <Select
                label={`Work type ${index + 1}`}
                value={entry.workTypeCode}
                required
                onChange={(event) =>
                  setEntries(
                    entries.map((value, itemIndex) =>
                      itemIndex === index
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
                label={`Optional detail ${index + 1}`}
                rows={2}
                value={entry.description}
                onChange={(event) =>
                  setEntries(
                    entries.map((value, itemIndex) =>
                      itemIndex === index
                        ? { ...value, description: event.target.value }
                        : value,
                    ),
                  )
                }
              />
              {entries.length > 1 ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() =>
                    setEntries(
                      entries.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove date
                </Button>
              ) : null}
            </div>
          ))}
        </fieldset>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            disabled={entries.length === 5}
            onClick={() =>
              setEntries([
                ...entries,
                { workDate: today, workTypeCode: '', description: '' },
              ])
            }
          >
            Add date
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Logging work…' : 'Log work'}
          </Button>
        </div>
        {mutation.error ? (
          <p role="alert">
            Work could not be logged. Your draft is preserved; refresh and try
            again.
          </p>
        ) : null}
        {statusError && selectedTicket.data ? (
          <>
            <p role="alert">
              Work was logged, but the status did not change. Refresh the ticket
              and retry only the status change.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void retryStatus()}
            >
              Retry status change
            </Button>
          </>
        ) : null}
      </form>
    </main>
  );
}
