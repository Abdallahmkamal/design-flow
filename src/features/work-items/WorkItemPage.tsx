import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Ellipsis,
  GripVertical,
  SendHorizontal,
  X,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { WorkItemExportPanel } from '../reports/WorkItemExportPanel';
import {
  Avatar,
  AvatarFallback,
  Button,
  Calendar,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  FormInput,
  FormTextarea,
  getAvatarToneClassName,
  getInitials,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetDescription,
  SheetOverlay,
  SheetPortal,
  SheetPrimitiveContent,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../ui/primitives';
import { Badge as StatusBadge } from '../../ui/Badge/Badge';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import figmaLinkAction from '../../assets/figma-link-action.svg';
import {
  addComment,
  addSubtask,
  archiveWorkItem,
  createBlocker,
  editComment,
  getWorkItemDetail,
  getWorkItemHistory,
  getWorkItemOptions,
  reassignWorkItem,
  renameSubtask,
  reorderSubtasks,
  resolveBlocker,
  restoreWorkItem,
  setSubtaskCompletion,
  transitionWorkItem,
  updateWorkItem,
  withdrawComment,
  withdrawSubtask,
  WorkItemApiError,
} from './workItemsApi';
import type {
  WorkItemActivityEntry,
  WorkItemComment,
  WorkItemDetail,
  WorkItemFormValues,
  WorkItemSubtask,
} from './workItemTypes';
import styles from './TicketDetails.module.css';

const eventLabels: Record<string, string> = {
  created: 'Ticket created',
  core_fields_changed: 'Ticket details updated',
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
  work_log_corrected: 'Work log corrected',
  work_log_withdrawn: 'Work log withdrawn',
};

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value))
    : 'Not set';
const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
const dateKey = (value: string) => value.slice(0, 10);
const isoDate = (value: Date) => value.toISOString().slice(0, 10);
const addDays = (value: Date, amount: number) => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
};
const sunday = (value: string) => {
  const day = new Date(`${dateKey(value)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - day.getUTCDay());
  return day;
};
const workingDays = (start: string, end: string) => {
  let cursor = new Date(`${dateKey(start)}T00:00:00Z`);
  const last = new Date(`${dateKey(end)}T00:00:00Z`);
  let count = 0;
  while (cursor <= last) {
    if (cursor.getUTCDay() <= 4) count += 1;
    cursor = addDays(cursor, 1);
  }
  return count;
};
const valuesFor = (item: WorkItemDetail): WorkItemFormValues => ({
  title: item.title,
  description: item.description ?? '',
  areaId: item.area.id,
  assigneeId: item.assignee?.id ?? '',
  plannedStartDate: item.plannedStartDate ?? '',
  dueDate: item.dueDate ?? '',
  figmaUrl: item.figmaUrl ?? '',
  labelIds: item.labels.map((label) => label.id),
});
const formValue = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
};

function useMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = matchMedia('(max-width: 47.999rem)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

function errorMessage(error: Error | null) {
  if (error instanceof WorkItemApiError) {
    if (error.code === 'DF_CONFLICT')
      return 'Someone updated this ticket first. Refresh the latest ticket, then retry your change.';
    if (error.code === 'DF_FORBIDDEN')
      return 'Your current permissions do not allow this change.';
    if (error.code === 'DF_INVALID_STATE')
      return 'The ticket state changed and no longer allows this action.';
  }
  return 'Design Flow could not save this change. Your displayed value was restored; try again.';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ChipMenu({
  label,
  summary,
  value,
  options,
  disabled,
  statusCode,
  onSelect,
}: {
  label: string;
  summary: ReactNode;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  statusCode?: string;
  onSelect: (value: string) => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details className={styles.chipMenu} ref={ref}>
      <summary
        role="button"
        aria-label={label}
        className={styles.chip}
        data-status={statusCode}
        aria-disabled={disabled ? true : undefined}
        onClick={(event) => disabled && event.preventDefault()}
      >
        {summary}
      </summary>
      <div role="listbox" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={option.value === value}
            key={option.value}
            onClick={() => {
              onSelect(option.value);
              if (ref.current) ref.current.open = false;
            }}
          >
            <span>{option.label}</span>
            {option.value === value ? <span aria-hidden="true">✓</span> : null}
          </button>
        ))}
      </div>
    </details>
  );
}

function MetricDatePicker({
  label,
  value,
  canEdit,
  onEditingChange,
  onSave,
}: {
  label: string;
  value: string | null;
  canEdit: boolean;
  onEditingChange: (editing: boolean) => void;
  onSave: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const toDateValue = (next: Date) =>
    [
      next.getFullYear(),
      String(next.getMonth() + 1).padStart(2, '0'),
      String(next.getDate()).padStart(2, '0'),
    ].join('-');
  return (
    <Field label={label}>
      {canEdit ? (
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            onEditingChange(nextOpen);
          }}
        >
          <PopoverTrigger
            render={<button type="button" />}
            className={styles.metricTrigger}
            aria-label={`${label}: ${date(value)}`}
          >
            {date(value)}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selected}
              {...(selected ? { defaultMonth: selected } : {})}
              onSelect={(next) => {
                if (!next) return;
                onSave(toDateValue(next));
                setOpen(false);
                onEditingChange(false);
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      ) : (
        date(value)
      )}
    </Field>
  );
}

function InlineTextEdit({
  ariaLabel,
  canEdit,
  className,
  displayValue,
  multiline = false,
  required = false,
  value,
  onEditingChange,
  onSave,
}: {
  ariaLabel: string;
  canEdit: boolean;
  className: string | undefined;
  displayValue?: string;
  multiline?: boolean;
  required?: boolean;
  value: string;
  onEditingChange: (editing: boolean) => void;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancel = () => {
    setDraft(value);
    setEditing(false);
    onEditingChange(false);
  };
  const save = () => {
    const next = draft.trim();
    if (required && !next) {
      cancel();
      return;
    }
    setEditing(false);
    onEditingChange(false);
    if (next !== value) onSave(next);
  };
  if (!canEdit)
    return <span className={className}>{displayValue ?? value}</span>;
  if (editing)
    return multiline ? (
      <textarea
        autoFocus
        data-inline-editor
        aria-label={ariaLabel}
        className={`${className} ${styles.inlineEditor}`}
        rows={Math.max(2, draft.split('\n').length)}
        value={draft}
        onBlur={save}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
          }
        }}
      />
    ) : (
      <input
        autoFocus
        data-inline-editor
        aria-label={ariaLabel}
        className={`${className} ${styles.inlineEditor}`}
        value={draft}
        onBlur={save}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
          }
        }}
      />
    );
  return (
    <button
      type="button"
      className={`${className} ${styles.inlineEditable}`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
        onEditingChange(true);
      }}
    >
      {displayValue ?? value}
    </button>
  );
}

function SubtaskRow({
  item,
  subtask,
  index,
  onEditingChange,
  run,
}: {
  item: WorkItemDetail;
  subtask: WorkItemSubtask;
  index: number;
  onEditingChange: (editing: boolean) => void;
  run: (label: string, task: () => Promise<unknown>) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!renaming) return;
    const focusInput = window.setTimeout(() => titleInputRef.current?.focus());
    return () => window.clearTimeout(focusInput);
  }, [renaming]);
  const ids = item.subtasks.map((entry) => entry.id);
  const move = (offset: number) => {
    const ordered = [...ids];
    const target = index + offset;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    run('Subtasks reordered.', () => reorderSubtasks(item, ordered));
  };
  const cancelRename = () => {
    setTitle(subtask.title);
    setRenaming(false);
    onEditingChange(false);
  };
  const saveRename = () => {
    const next = title.trim();
    if (next && next !== subtask.title)
      run('Subtask renamed.', () =>
        renameSubtask(subtask.id, next, subtask.updatedAt),
      );
    else setTitle(subtask.title);
    setRenaming(false);
    onEditingChange(false);
  };
  return (
    <li className={styles.subtaskRow}>
      <Checkbox
        className={styles.subtaskCheck}
        label={subtask.title}
        checked={subtask.isCompleted}
        disabled={!item.capabilities.canEditSubtasks}
        onChange={(event) => {
          const completed = event.currentTarget.checked;
          run(completed ? 'Subtask completed.' : 'Subtask reopened.', () =>
            setSubtaskCompletion(subtask.id, completed, subtask.isCompleted),
          );
        }}
      />
      {renaming ? (
        <input
          ref={titleInputRef}
          className={styles.subtaskTitleInput}
          aria-label={`Rename ${subtask.title}`}
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
          onBlur={saveRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              cancelRename();
            }
          }}
        />
      ) : item.capabilities.canEditSubtasks ? (
        <button
          type="button"
          className={styles.subtaskTitle}
          onClick={() => {
            setTitle(subtask.title);
            setRenaming(true);
            onEditingChange(true);
          }}
        >
          {subtask.title}
        </button>
      ) : (
        <span className={styles.subtaskTitle}>{subtask.title}</span>
      )}
      {item.capabilities.canEditSubtasks ? (
        <div className={styles.subtaskActions}>
          <details className={styles.subtaskOrder}>
            <summary aria-label={`Reorder ${subtask.title}`}>
              <GripVertical />
            </summary>
            <div>
              <button
                type="button"
                disabled={index === 0}
                onClick={(event) => {
                  move(-1);
                  event.currentTarget
                    .closest('details')
                    ?.removeAttribute('open');
                }}
              >
                <ArrowUp /> Move up
              </button>
              <button
                type="button"
                disabled={index === item.subtasks.length - 1}
                onClick={(event) => {
                  move(1);
                  event.currentTarget
                    .closest('details')
                    ?.removeAttribute('open');
                }}
              >
                <ArrowDown /> Move down
              </button>
            </div>
          </details>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Remove ${subtask.title}`}
            onClick={() =>
              run('Subtask withdrawn.', () =>
                withdrawSubtask(subtask.id, subtask.updatedAt),
              )
            }
          >
            <X />
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function Comment({
  comment,
  run,
}: {
  comment: WorkItemComment;
  run: (label: string, task: () => Promise<unknown>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body ?? '');
  const expected = comment.editedAt ?? comment.createdAt;
  return (
    <li className={styles.comment}>
      <header>
        <strong>{comment.author.displayName}</strong>
        <time dateTime={comment.createdAt}>{dateTime(comment.createdAt)}</time>
        {comment.editedAt ? <span>Edited</span> : null}
      </header>
      {comment.withdrawnAt ? (
        <p className={styles.empty}>Comment withdrawn.</p>
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
          <FormTextarea
            label="Edit comment"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <span className={styles.inlineActions}>
            <Button size="sm" type="submit">
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </span>
        </form>
      ) : (
        <p>{comment.body}</p>
      )}
      {!comment.withdrawnAt ? (
        <div className={styles.inlineActions}>
          {comment.canEdit ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          ) : null}
          {comment.canWithdraw ? (
            <Button
              size="sm"
              variant="ghost"
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

function WorkCalendar({
  item,
  mobile,
  selected,
  onSelect,
}: {
  item: Awaited<ReturnType<typeof getWorkItemHistory>>;
  mobile: boolean;
  selected: string;
  onSelect: (date: string) => void;
}) {
  const [shown, setShown] = useState(mobile ? 3 : 6);
  const summaries = new Map(item.workDates.map((entry) => [entry.date, entry]));
  if (!item.workDates.length)
    return <p className={styles.empty}>No work logs yet.</p>;
  const earliest = sunday(item.workDates[0]!.date);
  const latest = sunday(item.workDates[item.workDates.length - 1]!.date);
  const weeks: Date[] = [];
  for (let cursor = latest; cursor >= earliest; cursor = addDays(cursor, -7))
    weeks.push(cursor);
  const visible = weeks.slice(0, shown);
  return (
    <div className={styles.calendarWrap}>
      <div
        className={styles.calendar}
        aria-label="Sunday through Thursday work activity calendar"
      >
        {visible.map((week, index) => {
          const previous = visible[index - 1];
          const monthChanged =
            index === 0 || previous?.getUTCMonth() !== week.getUTCMonth();
          return (
            <div className={styles.week} key={isoDate(week)}>
              <span aria-hidden="true">
                {monthChanged
                  ? new Intl.DateTimeFormat('en', {
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(week)
                  : ''}
              </span>
              {[0, 1, 2, 3, 4].map((offset) => {
                const key = isoDate(addDays(week, offset));
                const summary = summaries.get(key);
                const count = summary?.logCount ?? 0;
                const people =
                  summary?.people
                    .map((person) => person.displayName)
                    .join(', ') ?? 'none';
                const types =
                  summary?.workTypes.join(', ').replaceAll('_', ' ') ?? 'none';
                const label = `${date(key)}: ${count} ${count === 1 ? 'log' : 'logs'}; people: ${people}; work types: ${types}`;
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={label}
                        aria-pressed={selected === key}
                        className={styles.calendarCell}
                        data-count={Math.min(count, 3)}
                        onClick={() => onSelect(key)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}
        {shown < weeks.length ? (
          <Button
            className={styles.showMore}
            size="sm"
            variant="ghost"
            onClick={() => setShown((current) => current + (mobile ? 3 : 6))}
          >
            Show earlier weeks
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ActivityFeed({
  entries,
  mobile,
  selected,
  onClear,
}: {
  entries: WorkItemActivityEntry[];
  mobile: boolean;
  selected: string;
  onClear: () => void;
}) {
  const [shown, setShown] = useState(mobile ? 6 : 10);
  const filtered = selected
    ? entries.filter((entry) => dateKey(entry.effectiveDate) === selected)
    : entries;
  if (!filtered.length)
    return (
      <p className={styles.empty}>
        {selected ? `No activity on ${date(selected)}.` : 'No activity yet.'}
      </p>
    );
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey(filtered[0]!.effectiveDate)}T00:00:00Z`));
  return (
    <>
      {selected ? (
        <Button size="sm" variant="secondary" onClick={onClear}>
          Clear {date(selected)} filter
        </Button>
      ) : null}
      <p className={styles.feedMonth}>{monthLabel}</p>
      <ol className={styles.feed}>
        {filtered.slice(0, shown).map((entry) => (
          <li
            key={entry.id}
            tabIndex={selected ? -1 : undefined}
            data-kind={entry.kind}
          >
            <Avatar
              className={`${styles.feedAvatar} ${getAvatarToneClassName(entry.actor.id)}`}
            >
              <AvatarFallback>
                {getInitials(entry.actor.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className={styles.feedDot} aria-hidden="true" />
            <div className={styles.feedContent}>
              <strong>
                {entry.kind === 'work_log'
                  ? entry.title
                  : (eventLabels[entry.type] ??
                    entry.title.replaceAll('_', ' '))}
              </strong>
              {entry.description ? <p>{entry.description}</p> : null}
            </div>
            <time className={styles.feedDate} dateTime={entry.effectiveDate}>
              {new Intl.DateTimeFormat('en', {
                day: 'numeric',
                month: 'short',
                timeZone: 'UTC',
              }).format(new Date(`${dateKey(entry.effectiveDate)}T00:00:00Z`))}
            </time>
          </li>
        ))}
      </ol>
      {shown < filtered.length ? (
        <Button
          variant="secondary"
          onClick={() => setShown((current) => current + (mobile ? 6 : 10))}
        >
          Show earlier activity
        </Button>
      ) : null}
    </>
  );
}

export function WorkItemPage() {
  const { displayId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mobile = useMobile();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(
    (location.state as { confirmation?: string } | null)?.confirmation ?? '',
  );
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState<string[]>([]);
  const [archivePrompt, setArchivePrompt] = useState(false);
  const [donePrompt, setDonePrompt] = useState(false);
  const [addBlockerOpen, setAddBlockerOpen] = useState(false);
  const [addSubtaskOpen, setAddSubtaskOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [inlineEditorActive, setInlineEditorActive] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  useEffect(
    () => () => {
      const launcher = sessionStorage.getItem('all-tickets-restore-focus');
      if (!launcher) return;
      window.setTimeout(() => {
        const element = [
          ...document.querySelectorAll<HTMLElement>(
            `[data-ticket-launcher="${CSS.escape(launcher)}"]`,
          ),
        ].find((candidate) => candidate.getClientRects().length > 0);
        if (!element) return;
        element.focus();
      });
    },
    [],
  );
  const item = useQuery({
    queryKey: ['work-item', displayId],
    queryFn: () => getWorkItemDetail(displayId),
  });
  const history = useQuery({
    queryKey: ['work-item-history', item.data?.id],
    queryFn: () => getWorkItemHistory(item.data!.id),
    enabled: Boolean(item.data?.id),
  });
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const mutation = useMutation({
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['work-item', displayId] }),
        queryClient.invalidateQueries({
          queryKey: ['work-item-history', item.data?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ['work-items'] }),
      ]);
      setError('');
      setMessage(label);
    },
    onError: (cause) => setError(errorMessage(cause)),
  });
  const run = (label: string, task: () => Promise<unknown>) =>
    mutation.mutate({ label, task });
  const dismiss = () => {
    const launcher = sessionStorage.getItem('all-tickets-launcher');
    if (launcher) sessionStorage.setItem('all-tickets-restore-focus', launcher);
    const state = location.state as { allTicketsUrl?: string } | null;
    if (state?.allTicketsUrl) void navigate(state.allTicketsUrl);
    else if (location.key !== 'default') void navigate(-1);
    else void navigate(`/work-items${location.search}`, { replace: true });
  };

  if (item.isPending || options.isPending)
    return (
      <Sheet open modal>
        <SheetPortal>
          <SheetOverlay />
          <SheetPrimitiveContent className={styles.overlay}>
            <SheetTitle asChild>
              <h1>Ticket Details</h1>
            </SheetTitle>
            <SheetDescription>Loading ticket details</SheetDescription>
            <p role="status" className={styles.state}>
              Loading Ticket Details…
            </p>
          </SheetPrimitiveContent>
        </SheetPortal>
      </Sheet>
    );
  if (item.isError || options.isError)
    return (
      <Sheet open modal>
        <SheetPortal>
          <SheetOverlay />
          <SheetPrimitiveContent className={styles.overlay}>
            <SheetTitle asChild>
              <h1>Ticket Details</h1>
            </SheetTitle>
            <SheetDescription>Ticket details failed to load</SheetDescription>
            <div role="alert" className={styles.state}>
              <p>Design Flow could not load this ticket.</p>
              <Button
                onClick={() => {
                  void item.refetch();
                  void options.refetch();
                }}
              >
                Retry
              </Button>
              <Button variant="secondary" onClick={dismiss}>
                Return to Work Items
              </Button>
            </div>
          </SheetPrimitiveContent>
        </SheetPortal>
      </Sheet>
    );
  if (!item.data)
    return (
      <Sheet open modal>
        <SheetPortal>
          <SheetOverlay />
          <SheetPrimitiveContent className={styles.overlay}>
            <SheetTitle asChild>
              <h1>Ticket not found</h1>
            </SheetTitle>
            <SheetDescription>
              The requested ticket is unavailable
            </SheetDescription>
            <div className={styles.state}>
              <p>The display ID does not identify a visible ticket.</p>
              <Button onClick={dismiss}>Return to Work Items</Button>
            </div>
          </SheetPrimitiveContent>
        </SheetPortal>
      </Sheet>
    );

  const workItem = item.data;
  const optionData = options.data;
  const patch = (label: string, changed: Partial<WorkItemFormValues>) =>
    run(label, () =>
      updateWorkItem(workItem, { ...valuesFor(workItem), ...changed }),
    );
  const daysOpen =
    history.data?.daysOpen ??
    (workItem.plannedStartDate
      ? workingDays(
          workItem.plannedStartDate,
          workItem.completedAt ?? new Date().toISOString(),
        )
      : null);
  const returnTo = encodeURIComponent(
    (location.state as { allTicketsUrl?: string } | null)?.allTicketsUrl ??
      `/work-items${location.search}`,
  );
  const headerContributors = Array.from(
    new Map(
      workItem.contributors
        .filter((person) => person.id !== workItem.assignee?.id)
        .map((person) => [person.id, person]),
    ).values(),
  ).slice(0, workItem.assignee ? 2 : 3);

  return (
    <Sheet
      open
      modal
      onOpenChange={(open) => {
        if (
          !open &&
          !inlineEditorActive &&
          !addSubtaskOpen &&
          !commentOpen &&
          !labelsOpen
        )
          dismiss();
      }}
    >
      <SheetPortal>
        <SheetOverlay className="z-[60] bg-black/48" />
        <SheetPrimitiveContent
          className={styles.overlay}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <SheetTitle className="sr-only">
            {workItem.displayId}: {workItem.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Ticket Details
          </SheetDescription>
          <div className={styles.scroller}>
            <header className={styles.header}>
              {mobile ? (
                <div className={styles.dismissRow}>
                  <Button size="sm" variant="ghost" onClick={dismiss}>
                    <ArrowLeft />
                    Back
                  </Button>
                </div>
              ) : null}
              <div className={styles.titleRow}>
                <div className={styles.titleBlock}>
                  <p className={styles.eyebrow}>
                    {workItem.area.name} / {workItem.displayId}
                  </p>
                  {!workItem.capabilities.canEdit ? (
                    <p className={styles.readOnly}>Read-only access.</p>
                  ) : null}
                  <h1>
                    <InlineTextEdit
                      ariaLabel="Ticket title"
                      canEdit={workItem.capabilities.canEdit}
                      className={styles.titleValue}
                      required
                      value={workItem.title}
                      onEditingChange={setInlineEditorActive}
                      onSave={(title) => patch('Title saved.', { title })}
                    />
                  </h1>
                </div>
                {!mobile ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Close Ticket Details"
                    onClick={dismiss}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
              <div className={styles.headerRows}>
                <div className={styles.badgeRow}>
                  <ChipMenu
                    label="Assignee"
                    summary={
                      <span className={styles.peopleSummary}>
                        {workItem.assignee ? (
                          <Avatar
                            className={`${styles.headerAvatar} ${getAvatarToneClassName(workItem.assignee.id)}`}
                          >
                            <AvatarFallback>
                              {getInitials(workItem.assignee.displayName)}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                        {workItem.assignee && headerContributors.length ? (
                          <span aria-hidden="true">+</span>
                        ) : null}
                        {headerContributors.map((person) => (
                          <Avatar
                            className={`${styles.headerAvatar} ${getAvatarToneClassName(person.id)}`}
                            key={person.id}
                          >
                            <AvatarFallback>
                              {getInitials(person.displayName)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </span>
                    }
                    value={workItem.assignee?.id ?? ''}
                    disabled={!workItem.capabilities.canReassign}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...optionData.people.map((person) => ({
                        value: person.id,
                        label: person.label,
                      })),
                    ]}
                    onSelect={(value) =>
                      run('Primary assignee saved.', () =>
                        reassignWorkItem(workItem, value),
                      )
                    }
                  />
                  <span className={styles.chipDivider} aria-hidden="true" />
                  <ChipMenu
                    label="Area"
                    summary={workItem.area.name}
                    value={workItem.area.id}
                    disabled={!workItem.capabilities.canEdit}
                    options={optionData.areas
                      .filter(
                        (entry) =>
                          entry.isActive ?? entry.id === workItem.area.id,
                      )
                      .map((entry) => ({
                        value: entry.id,
                        label: entry.label,
                      }))}
                    onSelect={(value) =>
                      patch('Area saved.', { areaId: value })
                    }
                  />
                  <ChipMenu
                    label="Status"
                    summary={workItem.status.label}
                    value={workItem.status.code}
                    disabled={!workItem.capabilities.canTransition}
                    statusCode={workItem.status.code}
                    options={optionData.statuses.map((entry) => ({
                      value: entry.code,
                      label: entry.label,
                    }))}
                    onSelect={(target) => {
                      if (
                        target === 'done' &&
                        workItem.completedSubtasks < workItem.totalSubtasks
                      ) {
                        setDonePrompt(true);
                        return;
                      }
                      run('Status saved.', () =>
                        transitionWorkItem(workItem, target, false),
                      );
                    }}
                  />
                  {workItem.activeBlocker ? (
                    <StatusBadge tone="blocked">Blocked</StatusBadge>
                  ) : null}
                  {workItem.isArchived ? (
                    <StatusBadge tone="archived">Archived</StatusBadge>
                  ) : null}
                  {workItem.figmaUrl ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          className={styles.figmaAction}
                          href={workItem.figmaUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${workItem.displayId} in Figma (opens in a new tab)`}
                        >
                          <img
                            src={figmaLinkAction}
                            alt=""
                            aria-hidden="true"
                          />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Open in Figma</TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                <div className={styles.topActions}>
                  {workItem.capabilities.canComment ? (
                    <Button asChild size="sm" className={styles.logWorkButton}>
                      <Link
                        to={`/work-logs/new?workItemId=${workItem.id}&returnTo=${returnTo}`}
                      >
                        Log Work
                      </Link>
                    </Button>
                  ) : null}
                  <details className={styles.overflow}>
                    <summary role="button" aria-label="More ticket actions">
                      <Ellipsis />
                    </summary>
                    <div>
                      <WorkItemExportPanel displayId={workItem.displayId} />
                      {workItem.capabilities.canArchive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`${styles.destructiveMenuAction} text-[var(--color-text-error)]!`}
                          onClick={() => setArchivePrompt(true)}
                        >
                          Archive
                        </Button>
                      ) : null}
                      {workItem.capabilities.canRestore ? (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            run('Ticket restored.', () =>
                              restoreWorkItem(workItem),
                            )
                          }
                        >
                          Restore
                        </Button>
                      ) : null}
                      {workItem.capabilities.canCreateBlocker &&
                      !workItem.activeBlocker ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAddBlockerOpen(true)}
                        >
                          Add blocker
                        </Button>
                      ) : null}
                    </div>
                  </details>
                </div>
              </div>
              <dl className={styles.metrics}>
                <MetricDatePicker
                  label="Planned start"
                  value={workItem.plannedStartDate}
                  canEdit={workItem.capabilities.canEdit}
                  onEditingChange={setInlineEditorActive}
                  onSave={(value) =>
                    patch('Planned start saved.', { plannedStartDate: value })
                  }
                />
                <MetricDatePicker
                  label="Due date"
                  value={workItem.dueDate}
                  canEdit={workItem.capabilities.canEdit}
                  onEditingChange={setInlineEditorActive}
                  onSave={(value) =>
                    patch('Due date saved.', { dueDate: value })
                  }
                />
                <Field label="First worked on">
                  {date(workItem.firstWorkedOn)}
                </Field>
                <Field label="Last worked on">
                  {date(workItem.lastWorkedOn)}
                </Field>
                <Field label="Open days">{daysOpen ?? 'Not set'}</Field>
                <Field label="Active days">{workItem.activeWorkDays}</Field>
              </dl>
            </header>

            {message ? (
              <div className={styles.success} role="status">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className={styles.error} role="alert">
                <span>{error}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setError('');
                    void item.refetch();
                  }}
                >
                  Refresh
                </Button>
              </div>
            ) : null}
            {archivePrompt ? (
              <section className={styles.warning}>
                <h2>Archive this ticket?</h2>
                <p>
                  History remains available and ordinary writes stop until
                  restore.
                </p>
                <span className={styles.inlineActions}>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setArchivePrompt(false);
                      run('Ticket archived.', () => archiveWorkItem(workItem));
                    }}
                  >
                    Confirm archive
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setArchivePrompt(false)}
                  >
                    Cancel
                  </Button>
                </span>
              </section>
            ) : null}
            {donePrompt ? (
              <section className={styles.warning} role="alert">
                <h2>Complete with unfinished subtasks?</h2>
                <p>
                  {workItem.totalSubtasks - workItem.completedSubtasks}{' '}
                  {workItem.totalSubtasks - workItem.completedSubtasks === 1
                    ? 'subtask is'
                    : 'subtasks are'}{' '}
                  still unfinished. You can proceed after acknowledging this.
                </p>
                <span className={styles.inlineActions}>
                  <Button
                    onClick={() => {
                      setDonePrompt(false);
                      run('Status saved.', () =>
                        transitionWorkItem(workItem, 'done', true),
                      );
                    }}
                  >
                    Complete anyway
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setDonePrompt(false)}
                  >
                    Keep current status
                  </Button>
                </span>
              </section>
            ) : null}
            {workItem.activeBlocker ? (
              <section className={styles.blocker}>
                <h2>Active blocker</h2>
                <p>{workItem.activeBlocker.reason}</p>
                <p>
                  {workItem.activeBlocker.blockedBy.displayName} ·{' '}
                  {dateTime(workItem.activeBlocker.blockedAt)}
                </p>
                <p>
                  Expected resolution:{' '}
                  {date(workItem.activeBlocker.expectedResolutionDate)}
                </p>
                {workItem.capabilities.canResolveBlocker ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      run('Blocker resolved.', () =>
                        resolveBlocker(workItem, formValue(data, 'note')),
                      );
                    }}
                  >
                    <FormTextarea
                      label="Resolution note (optional)"
                      name="note"
                    />
                    <Button type="submit">Resolve blocker</Button>
                  </form>
                ) : null}
              </section>
            ) : workItem.capabilities.canCreateBlocker ? (
              <details
                id="add-blocker"
                className={styles.addBlocker}
                open={addBlockerOpen}
                onToggle={(event) =>
                  setAddBlockerOpen(event.currentTarget.open)
                }
              >
                <summary>Add blocker</summary>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    run('Blocker added.', () =>
                      createBlocker(
                        workItem,
                        formValue(data, 'reason'),
                        formValue(data, 'date'),
                      ),
                    );
                  }}
                >
                  <FormTextarea required label="Blocker reason" name="reason" />
                  <FormInput
                    type="date"
                    label="Expected resolution date"
                    name="date"
                  />
                  <Button type="submit">Add blocker</Button>
                </form>
              </details>
            ) : null}

            <div className={styles.contentGrid}>
              <div className={styles.mainColumn}>
                <section className={styles.section}>
                  <h2>Subtasks</h2>
                  {workItem.capabilities.canEditSubtasks ? (
                    addSubtaskOpen ? (
                      <form
                        className={styles.inlineSubtaskDraft}
                        onSubmit={(event) => {
                          event.preventDefault();
                          const title = newSubtaskTitle.trim();
                          if (!title) return;
                          run('Subtask added.', async () => {
                            await addSubtask(workItem, title);
                            setNewSubtaskTitle('');
                            setAddSubtaskOpen(false);
                          });
                        }}
                        onBlur={(event) => {
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget,
                            ) &&
                            !newSubtaskTitle.trim()
                          )
                            setAddSubtaskOpen(false);
                        }}
                      >
                        <span
                          className={styles.draftCheckbox}
                          aria-hidden="true"
                        />
                        <input
                          autoFocus
                          data-inline-editor
                          aria-label="New subtask"
                          value={newSubtaskTitle}
                          onChange={(event) =>
                            setNewSubtaskTitle(event.currentTarget.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              event.stopPropagation();
                              setNewSubtaskTitle('');
                              setAddSubtaskOpen(false);
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className={styles.inlineIconAction}
                          aria-label="Save subtask"
                          disabled={!newSubtaskTitle.trim()}
                        >
                          <Check />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className={styles.textLink}
                        onClick={() => {
                          setNewSubtaskTitle('');
                          setAddSubtaskOpen(true);
                        }}
                      >
                        Add a subtask
                      </button>
                    )
                  ) : null}
                  {workItem.subtasks.length ? (
                    <ol className={styles.subtasks}>
                      {workItem.subtasks.map((subtask, index) => (
                        <SubtaskRow
                          key={subtask.id}
                          item={workItem}
                          subtask={subtask}
                          index={index}
                          onEditingChange={setInlineEditorActive}
                          run={run}
                        />
                      ))}
                    </ol>
                  ) : (
                    <p className={styles.empty}>No subtasks yet.</p>
                  )}
                </section>
                <section className={styles.section}>
                  <h2>Description</h2>
                  {workItem.description ? (
                    <div className={styles.descriptionLine}>
                      <InlineTextEdit
                        ariaLabel="Ticket description"
                        canEdit={workItem.capabilities.canEdit}
                        className={
                          descriptionExpanded
                            ? styles.description
                            : styles.descriptionCollapsed
                        }
                        displayValue={
                          descriptionExpanded
                            ? workItem.description
                            : `${workItem.description.slice(0, 180)}${
                                workItem.description.length > 180 ? '...' : ''
                              }`
                        }
                        multiline
                        value={workItem.description}
                        onEditingChange={setInlineEditorActive}
                        onSave={(description) =>
                          patch('Description saved.', { description })
                        }
                      />{' '}
                      {workItem.description.length > 180 ? (
                        <button
                          type="button"
                          className={styles.moreLink}
                          onClick={() =>
                            setDescriptionExpanded((current) => !current)
                          }
                        >
                          {descriptionExpanded ? 'Less' : 'More'}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <InlineTextEdit
                      ariaLabel="Ticket description"
                      canEdit={workItem.capabilities.canEdit}
                      className={styles.description}
                      displayValue="No description."
                      multiline
                      value=""
                      onEditingChange={setInlineEditorActive}
                      onSave={(description) =>
                        patch('Description saved.', { description })
                      }
                    />
                  )}
                </section>
                <section className={styles.section}>
                  <h2>Activity &amp; Work Log</h2>
                  {history.isPending ? (
                    <p role="status">Loading activity…</p>
                  ) : history.isError ? (
                    <div role="alert">
                      <p>Activity is temporarily unavailable.</p>
                      <Button onClick={() => void history.refetch()}>
                        Retry activity
                      </Button>
                    </div>
                  ) : history.data ? (
                    <div className={styles.activityLayout}>
                      <WorkCalendar
                        key={`calendar-${mobile ? 'mobile' : 'desktop'}`}
                        item={history.data}
                        mobile={mobile}
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                      />
                      <div>
                        <ActivityFeed
                          key={`feed-${mobile ? 'mobile' : 'desktop'}-${selectedDate}`}
                          entries={history.data.activityFeed}
                          mobile={mobile}
                          selected={selectedDate}
                          onClear={() => setSelectedDate('')}
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
              <aside
                className={styles.aside}
                aria-label="Ticket details and comments"
              >
                <section className={styles.section}>
                  <h2>Details</h2>
                  <dl className={styles.details}>
                    <Field label="Labels">
                      <DropdownMenu
                        open={labelsOpen}
                        onOpenChange={(open) => {
                          if (open) {
                            setLabelDraft(
                              workItem.labels.map((label) => label.id),
                            );
                          } else {
                            const current = workItem.labels
                              .map((label) => label.id)
                              .sort();
                            const next = [...labelDraft].sort();
                            if (current.join('|') !== next.join('|'))
                              patch('Labels saved.', { labelIds: labelDraft });
                          }
                          setLabelsOpen(open);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={styles.labelChip}
                            disabled={!workItem.capabilities.canEdit}
                          >
                            <span>
                              {workItem.labels.length
                                ? workItem.labels
                                    .map((label) => label.name)
                                    .join(', ')
                                : 'Add labels'}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className={styles.labelMenu}
                        >
                          {optionData.labels
                            .filter(
                              (entry) =>
                                entry.isActive ??
                                workItem.labels.some(
                                  (label) => label.id === entry.id,
                                ),
                            )
                            .map((label) => (
                              <DropdownMenuCheckboxItem
                                key={label.id}
                                checked={labelDraft.includes(label.id)}
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={(checked) =>
                                  setLabelDraft((current) =>
                                    checked
                                      ? [...current, label.id]
                                      : current.filter((id) => id !== label.id),
                                  )
                                }
                              >
                                {label.label}
                              </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Field>
                    <Field label="Figma URL">
                      <InlineTextEdit
                        ariaLabel="Figma URL"
                        canEdit={workItem.capabilities.canEdit}
                        className={styles.figmaUrl}
                        displayValue={workItem.figmaUrl ?? 'Not set'}
                        value={workItem.figmaUrl ?? ''}
                        onEditingChange={setInlineEditorActive}
                        onSave={(figmaUrl) =>
                          patch('Figma URL saved.', { figmaUrl })
                        }
                      />
                    </Field>
                    <Field label="Last activity">
                      {dateTime(workItem.lastActivityAt)}
                    </Field>
                    <Field label="Created by">
                      {workItem.createdBy.displayName}
                    </Field>
                  </dl>
                </section>
                <section className={styles.section}>
                  <h2>Comments</h2>
                  {workItem.comments.length ? (
                    <ol className={styles.comments}>
                      {workItem.comments.map((comment) => (
                        <Comment key={comment.id} comment={comment} run={run} />
                      ))}
                    </ol>
                  ) : null}
                  {workItem.capabilities.canComment ? (
                    commentOpen ? (
                      <form
                        className={styles.commentComposerInline}
                        onSubmit={(event: FormEvent<HTMLFormElement>) => {
                          event.preventDefault();
                          const body = commentDraft.trim();
                          if (!body) return;
                          run('Comment added.', async () => {
                            await addComment(workItem, body);
                            setCommentDraft('');
                            setCommentOpen(false);
                          });
                        }}
                        onBlur={(event) => {
                          if (
                            !event.currentTarget.contains(
                              event.relatedTarget,
                            ) &&
                            !commentDraft.trim()
                          )
                            setCommentOpen(false);
                        }}
                      >
                        <textarea
                          autoFocus
                          data-inline-editor
                          aria-label="Add comment"
                          placeholder="Add a comment..."
                          rows={1}
                          value={commentDraft}
                          onChange={(event) =>
                            setCommentDraft(event.currentTarget.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault();
                              event.stopPropagation();
                              setCommentDraft('');
                              setCommentOpen(false);
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className={styles.inlineIconAction}
                          aria-label="Send comment"
                          disabled={!commentDraft.trim()}
                        >
                          <SendHorizontal />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className={styles.commentPrompt}
                        onClick={() => {
                          setCommentDraft('');
                          setCommentOpen(true);
                        }}
                      >
                        Add a comment...
                      </button>
                    )
                  ) : (
                    <p className={styles.empty}>Comments are read-only.</p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </SheetPrimitiveContent>
      </SheetPortal>
    </Sheet>
  );
}
