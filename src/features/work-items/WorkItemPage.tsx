import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import { Badge, type BadgeTone } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import {
  addComment,
  addSubtask,
  archiveWorkItem,
  createBlocker,
  editComment,
  getWorkItemDetail,
  getWorkItemOptions,
  reassignWorkItem,
  renameSubtask,
  reorderSubtasks,
  resolveBlocker,
  restoreWorkItem,
  setSubtaskCompletion,
  transitionWorkItem,
  withdrawComment,
  withdrawSubtask,
  WorkItemApiError,
} from './workItemsApi';
import type {
  WorkItemComment,
  WorkItemDetail,
  WorkItemSubtask,
} from './workItemTypes';
import styles from './WorkItems.module.css';

const tones: Record<string, BadgeTone> = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  in_review: 'in_review',
  paused: 'paused',
  done: 'done',
};
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value))
    : '—';
const formString = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};
const eventLabels: Record<string, string> = {
  created: 'Ticket created',
  core_fields_changed: 'Details updated',
  labels_changed: 'Labels changed',
  assignment_changed: 'Assignee changed',
  status_changed: 'Status changed',
  reopened: 'Ticket reopened',
  blocker_created: 'Blocker added',
  blocker_resolved: 'Blocker resolved',
  subtask_added: 'Subtask added',
  subtask_renamed: 'Subtask renamed',
  subtask_reordered: 'Subtasks reordered',
  subtask_completed: 'Subtask completed',
  subtask_reopened: 'Subtask reopened',
  subtask_withdrawn: 'Subtask withdrawn',
  archived: 'Ticket archived',
  restored: 'Ticket restored',
};

function actionError(error: Error | null) {
  if (error instanceof WorkItemApiError) {
    if (error.code === 'DF_CONFLICT')
      return 'Someone changed this ticket first. Your input is preserved; refresh the authoritative state and try again.';
    if (error.code === 'DF_INVALID_STATE')
      return 'The ticket is no longer in a state that allows this action.';
    if (error.code === 'DF_FORBIDDEN')
      return 'Your current permissions do not allow this action.';
  }
  return 'Design Flow could not complete the action. Your input is preserved.';
}

function SubtaskRow({
  item,
  subtask,
  index,
  run,
}: {
  item: WorkItemDetail;
  subtask: WorkItemSubtask;
  index: number;
  run: (label: string, action: () => Promise<unknown>) => void;
}) {
  const [title, setTitle] = useState(subtask.title);
  const ids = item.subtasks.map((value) => value.id);
  const move = (offset: number) => {
    const next = [...ids];
    const target = index + offset;
    [next[index], next[target]] = [next[target]!, next[index]!];
    run('Subtasks reordered.', () => reorderSubtasks(item, next));
  };
  return (
    <li className={styles.subtask}>
      <Checkbox
        label={subtask.title}
        checked={subtask.isCompleted}
        onChange={(event) =>
          run(
            event.target.checked ? 'Subtask completed.' : 'Subtask reopened.',
            () =>
              setSubtaskCompletion(
                subtask.id,
                event.target.checked,
                subtask.isCompleted,
              ),
          )
        }
      />
      <form
        className={styles.inlineForm}
        onSubmit={(event) => {
          event.preventDefault();
          run('Subtask renamed.', () =>
            renameSubtask(subtask.id, title, subtask.updatedAt),
          );
        }}
      >
        <Input
          hideLabel
          label={`Rename ${subtask.title}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button
          size="small"
          variant="secondary"
          type="submit"
          disabled={!title.trim() || title === subtask.title}
        >
          Rename
        </Button>
      </form>
      <div className={styles.inlineActions}>
        <Button
          size="small"
          variant="ghost"
          aria-label={`Move ${subtask.title} up`}
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          ↑
        </Button>
        <Button
          size="small"
          variant="ghost"
          aria-label={`Move ${subtask.title} down`}
          disabled={index === item.subtasks.length - 1}
          onClick={() => move(1)}
        >
          ↓
        </Button>
        <Button
          size="small"
          variant="destructive"
          onClick={() =>
            run('Subtask withdrawn.', () =>
              withdrawSubtask(subtask.id, subtask.updatedAt),
            )
          }
        >
          Withdraw
        </Button>
      </div>
    </li>
  );
}

function CommentRow({
  comment,
  run,
}: {
  comment: WorkItemComment;
  run: (label: string, action: () => Promise<unknown>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body ?? '');
  const expected = comment.editedAt ?? comment.createdAt;
  return (
    <li className={styles.comment}>
      <header>
        <strong>{comment.author.displayName}</strong>
        <time dateTime={comment.createdAt}>{date(comment.createdAt)}</time>
        {comment.editedAt ? <span>(edited)</span> : null}
      </header>
      {comment.withdrawnAt ? (
        <p className={styles.withdrawn}>
          Comment withdrawn
          {comment.withdrawnBy ? ` by ${comment.withdrawnBy.displayName}` : ''}.
        </p>
      ) : editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run('Comment updated.', () =>
              editComment(comment.id, body, expected),
            );
            setEditing(false);
          }}
        >
          <Textarea
            label="Edit comment"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className={styles.inlineActions}>
            <Button size="small" type="submit">
              Save comment
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p>{comment.body}</p>
      )}
      {!comment.withdrawnAt ? (
        <div className={styles.inlineActions}>
          {comment.canEdit ? (
            <Button
              size="small"
              variant="ghost"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          ) : null}
          {comment.canWithdraw ? (
            <Button
              size="small"
              variant="destructive"
              onClick={() =>
                run('Comment withdrawn.', () =>
                  withdrawComment(comment.id, expected),
                )
              }
            >
              Withdraw
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function WorkItemPage() {
  const { displayId = '' } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const confirmationRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [confirmation, setConfirmation] = useState(
    (location.state as { confirmation?: string } | null)?.confirmation ?? '',
  );
  const [error, setError] = useState('');
  const [archiveConfirmation, setArchiveConfirmation] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [assigneeOverride, setAssigneeOverride] = useState<string | null>(null);
  const [acknowledge, setAcknowledge] = useState(false);
  const item = useQuery({
    queryKey: ['work-item', displayId],
    queryFn: () => getWorkItemDetail(displayId),
  });
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const action = useMutation({
    mutationFn: async ({
      label,
      task,
    }: {
      label: string;
      task: () => Promise<unknown>;
    }) => {
      await task();
      return label;
    },
    onSuccess: async (label) => {
      await queryClient.invalidateQueries({
        queryKey: ['work-item', displayId],
      });
      await queryClient.invalidateQueries({ queryKey: ['work-items'] });
      setError('');
      setConfirmation(label);
      requestAnimationFrame(() => confirmationRef.current?.focus());
    },
    onError: (cause) => setError(actionError(cause)),
  });
  const run = (label: string, task: () => Promise<unknown>) =>
    action.mutate({ label, task });

  useEffect(() => {
    if (confirmation) confirmationRef.current?.focus();
    else headingRef.current?.focus();
  }, [confirmation]);

  if (item.isPending)
    return (
      <div className={styles.state} role="status">
        Loading Work Item…
      </div>
    );
  if (item.isError)
    return (
      <div className={styles.state} role="alert">
        <p>Design Flow could not load this Work Item.</p>
        <Button variant="secondary" onClick={() => void item.refetch()}>
          Retry
        </Button>
      </div>
    );
  if (!item.data)
    return (
      <div className={styles.state}>
        <h1>Ticket not found</h1>
        <p>The display ID does not identify a visible Work Item.</p>
        <Link to="/work-items">Return to All Tickets</Link>
      </div>
    );
  const workItem = item.data;
  const selectedStatus = statusOverride ?? workItem.status.code;
  const selectedAssignee = assigneeOverride ?? workItem.assignee?.id ?? '';

  return (
    <div className={styles.detailPage}>
      {confirmation ? (
        <div
          className={styles.successPanel}
          role="status"
          tabIndex={-1}
          ref={confirmationRef}
        >
          {confirmation}
        </div>
      ) : null}
      {error ? (
        <div className={styles.errorPanel} role="alert">
          {error}
          <Button
            size="small"
            variant="secondary"
            onClick={() => void item.refetch()}
          >
            Refresh ticket
          </Button>
        </div>
      ) : null}
      <header className={styles.detailHeader}>
        <div>
          <Link to="/work-items">All Tickets</Link>
          <div className={styles.ticketIdentity}>
            <span>{workItem.displayId}</span>
            <div className={styles.indicators}>
              <Badge tone={tones[workItem.status.code] ?? 'neutral'}>
                {workItem.status.label}
              </Badge>
              {workItem.activeBlocker ? (
                <Badge tone="blocked">Blocked</Badge>
              ) : null}
              {workItem.isArchived ? (
                <Badge tone="archived">Archived</Badge>
              ) : null}
            </div>
          </div>
          <h1 ref={headingRef} tabIndex={-1}>
            {workItem.title}
          </h1>
          <p>{workItem.area.name}</p>
        </div>
        <div className={styles.headerActions}>
          {workItem.capabilities.canEdit ? (
            <Link
              className={styles.secondaryLink}
              to={`/work-items/${workItem.displayId}/edit`}
            >
              Edit details
            </Link>
          ) : null}
          {workItem.figmaUrl ? (
            <a
              className={styles.secondaryLink}
              href={workItem.figmaUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${workItem.displayId} in Figma (opens in a new tab)`}
            >
              Open Figma ↗
            </a>
          ) : null}
          {workItem.capabilities.canArchive ? (
            <Button
              variant="destructive"
              onClick={() => setArchiveConfirmation(true)}
            >
              Archive
            </Button>
          ) : null}
          {workItem.capabilities.canRestore ? (
            <Button
              variant="secondary"
              onClick={() =>
                run('Ticket restored.', () => restoreWorkItem(workItem))
              }
            >
              Restore
            </Button>
          ) : null}
        </div>
      </header>
      {archiveConfirmation ? (
        <section
          className={styles.confirmPanel}
          aria-labelledby="archive-heading"
        >
          <h2 id="archive-heading">Archive this ticket?</h2>
          <p>
            It will remain readable, while all ordinary writes are denied until
            an authorized person restores it.
          </p>
          <div className={styles.inlineActions}>
            <Button
              variant="destructive"
              onClick={() => {
                setArchiveConfirmation(false);
                run('Ticket archived.', () => archiveWorkItem(workItem));
              }}
            >
              Confirm archive
            </Button>
            <Button
              variant="secondary"
              onClick={() => setArchiveConfirmation(false)}
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
      {workItem.activeBlocker ? (
        <section className={styles.blockerPanel}>
          <h2>Active blocker</h2>
          <p>{workItem.activeBlocker.reason}</p>
          <dl>
            <div>
              <dt>Blocked by</dt>
              <dd>{workItem.activeBlocker.blockedBy.displayName}</dd>
            </div>
            <div>
              <dt>Expected resolution</dt>
              <dd>{date(workItem.activeBlocker.expectedResolutionDate)}</dd>
            </div>
          </dl>
          {workItem.capabilities.canResolveBlocker ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                run('Blocker resolved.', () =>
                  resolveBlocker(workItem, formString(form, 'note')),
                );
              }}
            >
              <Textarea label="Resolution note (optional)" name="note" />
              <Button type="submit" isLoading={action.isPending}>
                Resolve blocker
              </Button>
            </form>
          ) : null}
        </section>
      ) : workItem.capabilities.canCreateBlocker ? (
        <details className={styles.actionPanel}>
          <summary>Add blocker</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              run('Blocker added.', () =>
                createBlocker(
                  workItem,
                  formString(form, 'reason'),
                  formString(form, 'date'),
                ),
              );
            }}
          >
            <Textarea required label="Blocker reason" name="reason" />
            <Input label="Expected resolution date" type="date" name="date" />
            <Button type="submit">Add blocker</Button>
          </form>
        </details>
      ) : null}
      <div className={styles.detailGrid}>
        <div className={styles.detailMain}>
          <section className={styles.section}>
            <h2>Summary</h2>
            <p className={styles.description}>
              {workItem.description ?? 'No description provided.'}
            </p>
            <div className={styles.chipList}>
              {workItem.labels.map((label) => (
                <Badge key={label.id}>{label.name}</Badge>
              ))}
            </div>
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Subtasks</h2>
                <p>
                  {workItem.completedSubtasks} of {workItem.totalSubtasks}{' '}
                  completed
                </p>
              </div>
            </div>
            {workItem.subtasks.length ? (
              <ol className={styles.subtaskList}>
                {workItem.subtasks.map((subtask, index) => (
                  <SubtaskRow
                    key={subtask.id}
                    item={workItem}
                    subtask={subtask}
                    index={index}
                    run={run}
                  />
                ))}
              </ol>
            ) : (
              <p>No subtasks yet.</p>
            )}
            {workItem.capabilities.canEditSubtasks ? (
              <form
                className={styles.inlineForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const title = formString(form, 'title');
                  run('Subtask added.', () => addSubtask(workItem, title));
                }}
              >
                <Input label="New subtask" name="title" required />
                <Button type="submit">Add subtask</Button>
              </form>
            ) : null}
          </section>
          <section className={styles.section}>
            <h2>Lifecycle timeline</h2>
            {workItem.events.length ? (
              <ol className={styles.timeline}>
                {workItem.events.map((event) => (
                  <li key={event.id}>
                    <span aria-hidden="true" />
                    <div>
                      <strong>{eventLabels[event.type] ?? event.type}</strong>
                      <p>
                        {event.actor.displayName} ·{' '}
                        <time dateTime={event.occurredAt}>
                          {date(event.occurredAt)}
                        </time>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No Phase 3 lifecycle events are available.</p>
            )}
          </section>
          <section className={styles.section}>
            <h2>Comments</h2>
            {workItem.comments.length ? (
              <ol className={styles.commentList}>
                {workItem.comments.map((comment) => (
                  <CommentRow key={comment.id} comment={comment} run={run} />
                ))}
              </ol>
            ) : (
              <p>No comments yet.</p>
            )}
            {workItem.capabilities.canComment ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  run('Comment added.', () =>
                    addComment(workItem, formString(form, 'body')),
                  );
                }}
              >
                <Textarea label="Add comment" name="body" required />
                <Button type="submit">Add comment</Button>
              </form>
            ) : (
              <p className={styles.muted}>
                Comments are read-only for your current access.
              </p>
            )}
          </section>
        </div>
        <aside className={styles.detailAside} aria-label="Ticket details">
          <section className={styles.section}>
            <h2>Controls</h2>
            {workItem.capabilities.canTransition ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run('Status updated.', () =>
                    transitionWorkItem(workItem, selectedStatus, acknowledge),
                  );
                }}
              >
                <Select
                  label="Status"
                  value={selectedStatus}
                  onChange={(event) => setStatusOverride(event.target.value)}
                >
                  {options.data?.statuses.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {selectedStatus === 'done' &&
                workItem.completedSubtasks < workItem.totalSubtasks ? (
                  <Checkbox
                    label="Acknowledge incomplete subtasks"
                    checked={acknowledge}
                    onChange={(event) => setAcknowledge(event.target.checked)}
                  />
                ) : null}
                <Button
                  size="small"
                  type="submit"
                  disabled={selectedStatus === workItem.status.code}
                >
                  Update status
                </Button>
              </form>
            ) : null}
            {workItem.capabilities.canReassign ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run('Assignee updated.', () =>
                    reassignWorkItem(workItem, selectedAssignee),
                  );
                }}
              >
                <Select
                  label="Assignee"
                  value={selectedAssignee}
                  onChange={(event) => setAssigneeOverride(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {options.data?.people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.label}
                    </option>
                  ))}
                </Select>
                <Button
                  size="small"
                  type="submit"
                  variant="secondary"
                  disabled={selectedAssignee === (workItem.assignee?.id ?? '')}
                >
                  Update assignee
                </Button>
              </form>
            ) : null}
            {!workItem.capabilities.canTransition &&
            !workItem.capabilities.canReassign ? (
              <p>Read-only access.</p>
            ) : null}
          </section>
          <section className={styles.section}>
            <h2>Details</h2>
            <dl className={styles.detailsList}>
              <div>
                <dt>Assignee</dt>
                <dd>{workItem.assignee?.displayName ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt>Contributors</dt>
                <dd>
                  {workItem.contributors
                    .map((person) => person.displayName)
                    .join(', ') || 'None'}
                </dd>
              </div>
              <div>
                <dt>Planned start</dt>
                <dd>{date(workItem.plannedStartDate)}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{date(workItem.dueDate)}</dd>
              </div>
              <div>
                <dt>First worked on</dt>
                <dd>{date(workItem.firstWorkedOn)}</dd>
              </div>
              <div>
                <dt>Last worked on</dt>
                <dd>{date(workItem.lastWorkedOn)}</dd>
              </div>
              <div>
                <dt>Active work days</dt>
                <dd>{workItem.activeWorkDays}</dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{workItem.createdBy.displayName}</dd>
              </div>
            </dl>
            <p className={styles.muted}>
              Planned dates and actual work dates are intentionally distinct.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
