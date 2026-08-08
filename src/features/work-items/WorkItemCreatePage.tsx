import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { createOperationId } from '../../shared/operations/operationId';
import { Button } from '../../ui/primitives/button';
import { WorkflowOverlay } from '../../ui/WorkflowOverlay/WorkflowOverlay';
import { WorkItemForm } from './WorkItemForm';
import {
  createWorkItem,
  getWorkItemOptions,
  WorkItemApiError,
} from './workItemsApi';
import type { WorkItemFormValues } from './workItemTypes';
import styles from './WorkItems.module.css';

const errorMessage = (error: Error | null) => {
  if (error instanceof WorkItemApiError) {
    if (error.code === 'DF_CONFLICT')
      return 'This request conflicts with newer data. Your entries are preserved; review and try again.';
    if (
      [
        'DF_FORBIDDEN',
        'DF_ACCOUNT_INACTIVE',
        'DF_PASSWORD_CHANGE_REQUIRED',
      ].includes(error.code)
    )
      return 'Your permission changed before creation. The ticket was not created and your entries are preserved.';
    if (error.code === 'DF_IDEMPOTENCY_MISMATCH')
      return 'This retry no longer matches the original request. Review the preserved values and submit again.';
  }
  return 'Design Flow could not create this ticket. Your entries are preserved; try again.';
};

const blank = (assigneeId = ''): WorkItemFormValues => ({
  title: '',
  description: '',
  areaId: '',
  assigneeId,
  plannedStartDate: '',
  dueDate: '',
  figmaUrl: '',
  labelIds: [],
});

export function WorkItemCreatePage() {
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const [draft, setDraft] = useState<WorkItemFormValues | null>(null);
  const [operationId, setOperationId] = useState(createOperationId);
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const initialValues = useMemo(
    () =>
      blank(
        options.data?.people.some((person) => person.id === account?.id)
          ? account?.id
          : '',
      ),
    [account?.id, options.data?.people],
  );
  const create = useMutation({
    mutationFn: (values: WorkItemFormValues) =>
      createWorkItem(values, operationId),
    onSuccess: (result) => {
      void navigate(`/work-items/${result.display_id}`, {
        replace: true,
        state: { confirmation: `${result.display_id} created in Backlog.` },
      });
    },
  });
  const dismiss = () => {
    if (location.key === 'default')
      void navigate('/work-items', { replace: true });
    else void navigate(-1);
  };

  if (account?.positionCode === 'viewer')
    return (
      <main className={styles.page}>
        <h1>Create ticket</h1>
        <div className={styles.state} role="status">
          <p>Viewers can review Work Items but cannot create them.</p>
          <Link to="/work-items">Return to All Tickets</Link>
        </div>
      </main>
    );

  const isDirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(initialValues);
  const canSubmit = Boolean(
    (draft ?? initialValues).title.trim() && (draft ?? initialValues).areaId,
  );

  return (
    <WorkflowOverlay
      title="Create ticket"
      description="Create one ticket in Backlog. This operation does not log work or change status."
      isDirty={isDirty}
      isBusy={create.isPending}
      onDismiss={dismiss}
      footer={
        <Button
          className="h-12 w-full rounded-xl text-base"
          type="submit"
          form="create-ticket-form"
          disabled={!canSubmit || options.isPending}
          isLoading={create.isPending}
        >
          Create ticket
        </Button>
      }
    >
      {options.isPending ? <p role="status">Loading ticket fields…</p> : null}
      {options.isError ? (
        <div role="alert" className="grid gap-3">
          <p>Design Flow could not load ticket fields.</p>
          <Button variant="secondary" onClick={() => void options.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      {options.data ? (
        <WorkItemForm
          formId="create-ticket-form"
          hideSubmitButton
          showCreationStatus={false}
          options={options.data}
          initialValues={draft ?? initialValues}
          submitLabel="Create ticket"
          isSubmitting={create.isPending}
          serverError={create.isError ? errorMessage(create.error) : undefined}
          onValuesChange={(values) => {
            setDraft(values);
            if (create.isError) {
              create.reset();
              setOperationId(createOperationId());
            }
          }}
          onSubmit={(values) => create.mutate(values)}
        />
      ) : null}
    </WorkflowOverlay>
  );
}
