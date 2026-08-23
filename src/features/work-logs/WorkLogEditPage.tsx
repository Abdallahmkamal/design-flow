import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../ui/primitives/button';
import {
  FormDatePicker,
  FormSelect,
  FormTextarea,
} from '../../ui/primitives/form-controls';
import { WorkflowOverlay } from '../../ui/WorkflowOverlay/WorkflowOverlay';
import { useAuthentication } from '../auth/authContext';
import { getWorkItemOptions } from '../work-items/workItemsApi';
import { workTypesForContext } from './workLogOptions';
import {
  correctWorkLog,
  getWorkLogBatch,
  withdrawWorkLog,
  type WorkLogBatch,
} from './workLogsApi';
import styles from './WorkLogPage.module.css';

const today = new Date().toISOString().slice(0, 10);

export function WorkLogEditPage() {
  const { batchId = '' } = useParams();
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<WorkLogBatch | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const batch = useQuery({
    queryKey: ['work-log-batch', batchId],
    queryFn: () => getWorkLogBatch(batchId),
  });
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const source = draft ?? batch.data;
  const save = useMutation({ mutationFn: correctWorkLog });
  const withdrawal = useMutation({ mutationFn: withdrawWorkLog });
  const busy = save.isPending || withdrawal.isPending;
  const canChoosePerson = Boolean(
    account &&
    (account.isAdmin || ['lead', 'manager'].includes(account.positionCode)),
  );
  const dismiss = () => {
    if (location.key === 'default')
      void navigate('/work-items', { replace: true });
    else void navigate(-1);
  };
  const refreshAfterMutation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work-log-batch', batchId] }),
      queryClient.invalidateQueries({ queryKey: ['work-items'] }),
      queryClient.invalidateQueries({ queryKey: ['work-item'] }),
      queryClient.invalidateQueries({ queryKey: ['work-item-history'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
    ]);
    dismiss();
  };

  if (batch.isPending || options.isPending) {
    return (
      <WorkflowOverlay
        title="Edit work log"
        description="Loading the selected work submission."
        isBusy
        onDismiss={dismiss}
        footer={
          <Button className="h-12 w-full rounded-xl text-base" disabled>
            Save changes
          </Button>
        }
      >
        <p role="status">Loading work log…</p>
      </WorkflowOverlay>
    );
  }

  if (!source?.canCorrect) {
    return (
      <WorkflowOverlay
        title="Edit work log"
        description="The selected work submission is unavailable."
        onDismiss={dismiss}
        footer={
          <Button
            className="h-12 w-full rounded-xl text-base"
            onClick={dismiss}
          >
            Close
          </Button>
        }
      >
        <p role="alert">
          This work log is unavailable or you cannot correct it.
        </p>
      </WorkflowOverlay>
    );
  }

  const workTypes = workTypesForContext(source.context);
  const isDirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(batch.data);
  const update = (patch: Partial<WorkLogBatch>) =>
    setDraft({ ...source, ...patch });
  const updateEntry = (
    entryId: string,
    patch: Partial<WorkLogBatch['entries'][number]>,
  ) =>
    update({
      entries: source.entries.map((entry) =>
        entry.id === entryId ? { ...entry, ...patch } : entry,
      ),
    });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync(source);
      await refreshAfterMutation();
    } catch {
      /* Preserve the complete batch draft for retry. */
    }
  };
  const withdraw = async () => {
    try {
      await withdrawal.mutateAsync(source);
      await refreshAfterMutation();
    } catch {
      /* Keep the confirmation visible so the user can retry or cancel. */
    }
  };

  return (
    <WorkflowOverlay
      title="Edit work log"
      description="Correct every date in this submission, change its credited member when authorized, or withdraw the submission."
      isDirty={isDirty}
      isBusy={busy}
      onDismiss={dismiss}
      footer={
        <div className="grid gap-2">
          <Button
            className="h-12 w-full rounded-xl text-base"
            type="submit"
            form="edit-work-log-form"
            disabled={
              !isDirty ||
              source.entries.some(
                (entry) =>
                  !entry.workDate ||
                  entry.workDate > today ||
                  !entry.workTypeCode,
              )
            }
            isLoading={save.isPending}
          >
            Save changes
          </Button>
          {source.canWithdraw ? (
            <Button
              className="h-11 w-full rounded-xl border-destructive text-destructive! hover:bg-destructive/10"
              variant="ghost"
              onClick={() => setConfirmWithdraw(true)}
              disabled={busy || confirmWithdraw}
            >
              Withdraw work log
            </Button>
          ) : null}
        </div>
      }
    >
      <form
        id="edit-work-log-form"
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
            variant="ghost"
            className={
              source.context === 'ticket'
                ? 'h-10 rounded-full border-0 bg-background px-4 opacity-100'
                : 'h-10 rounded-full border-0 bg-transparent px-4'
            }
            aria-pressed={source.context === 'ticket'}
            disabled
          >
            Ticket work
          </Button>
          <Button
            variant="ghost"
            className={
              source.context === 'standalone_visual'
                ? 'h-10 rounded-full border-0 bg-background px-4 opacity-100'
                : 'h-10 rounded-full border-0 bg-transparent px-4'
            }
            aria-pressed={source.context === 'standalone_visual'}
            disabled
          >
            Standalone Visual Work
          </Button>
        </div>

        {canChoosePerson ? (
          <FormSelect
            label="Worked by"
            value={source.workedBy}
            onChange={(event) => update({ workedBy: event.target.value })}
          >
            {options.data?.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.label}
              </option>
            ))}
          </FormSelect>
        ) : null}

        <fieldset className={styles.dateRows}>
          <legend>Work Date(s)</legend>
          {source.entries.map((entry, index) => (
            <div className={styles.dateRow} key={entry.id}>
              <div className={styles.dateFieldRow}>
                <FormDatePicker
                  label="Work Date"
                  aria-label={`Work Date ${index + 1}`}
                  max={today}
                  required
                  value={entry.workDate}
                  {...(entry.workDate > today
                    ? { error: 'Future dates are not allowed.' }
                    : {})}
                  onChange={(event) =>
                    updateEntry(entry.id, { workDate: event.target.value })
                  }
                />
                <FormSelect
                  label="Work Type"
                  aria-label={`Work Type ${index + 1}`}
                  required
                  value={entry.workTypeCode}
                  onChange={(event) =>
                    updateEntry(entry.id, {
                      workTypeCode: event.target.value,
                    })
                  }
                >
                  {workTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <FormTextarea
                label="Description (optional)"
                aria-label={`Description ${index + 1} (optional)`}
                className="h-12 min-h-12 resize-none"
                rows={1}
                value={entry.description}
                onChange={(event) =>
                  updateEntry(entry.id, { description: event.target.value })
                }
              />
            </div>
          ))}
        </fieldset>

        <p className="m-0 text-sm text-muted-foreground">
          Worked By applies to every date in this submission. The original
          submitter and ticket context remain unchanged.
        </p>

        {confirmWithdraw ? (
          <section
            className="grid gap-4 rounded-xl border border-destructive bg-destructive/10 p-4"
            role="alertdialog"
            aria-labelledby="withdraw-work-log-title"
            aria-describedby="withdraw-work-log-description"
          >
            <h2
              id="withdraw-work-log-title"
              className="m-0 text-lg font-semibold"
            >
              Withdraw this work log?
            </h2>
            <p
              id="withdraw-work-log-description"
              className="m-0 text-sm text-muted-foreground"
            >
              Every date in this submission will leave normal activity, reports,
              and exports. This cannot be restored; unsaved edits are discarded.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="destructive"
                onClick={() => void withdraw()}
                isLoading={withdrawal.isPending}
              >
                Confirm withdrawal
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmWithdraw(false)}
                disabled={withdrawal.isPending}
              >
                Keep work log
              </Button>
            </div>
          </section>
        ) : null}

        {save.error || withdrawal.error ? (
          <p className={styles.error} role="alert">
            The action could not be completed. Current values and your draft
            remain available; refresh if another correction changed this log.
          </p>
        ) : null}
      </form>
    </WorkflowOverlay>
  );
}
