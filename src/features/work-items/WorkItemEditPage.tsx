import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { WorkItemForm } from './WorkItemForm';
import { valuesFromDetail } from './workItemFormValues';
import {
  getWorkItemDetail,
  getWorkItemOptions,
  updateWorkItem,
  WorkItemApiError,
} from './workItemsApi';
import styles from './WorkItems.module.css';

export function WorkItemEditPage() {
  const { displayId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const item = useQuery({
    queryKey: ['work-item', displayId],
    queryFn: () => getWorkItemDetail(displayId),
  });
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const update = useMutation({
    mutationFn: (values: Parameters<typeof updateWorkItem>[1]) =>
      updateWorkItem(item.data!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['work-item', displayId],
      });
      void navigate(`/work-items/${displayId}`, {
        state: { confirmation: 'Ticket details updated.' },
      });
    },
  });
  if (item.isPending || options.isPending)
    return (
      <div className={styles.state} role="status">
        Loading ticket…
      </div>
    );
  if (item.isError || options.isError)
    return (
      <div className={styles.state} role="alert">
        Design Flow could not load this edit form.
      </div>
    );
  if (!item.data)
    return (
      <div className={styles.state}>
        <h1>Ticket not found</h1>
        <Link to="/work-items">Return to All Tickets</Link>
      </div>
    );
  if (!item.data.capabilities.canEdit)
    return (
      <div className={styles.state}>
        <h1>Edit {item.data.displayId}</h1>
        <p>You do not have permission to edit this ticket.</p>
        <Link to={`/work-items/${item.data.displayId}`}>Return to ticket</Link>
      </div>
    );
  const message =
    update.error instanceof WorkItemApiError &&
    update.error.code === 'DF_CONFLICT'
      ? 'Someone changed this ticket. Your entries are preserved; return to the ticket for the latest version or review and try again.'
      : 'Design Flow could not update this ticket. Your entries are preserved.';
  return (
    <div className={styles.narrowPage}>
      <header className={styles.pageHeader}>
        <div>
          <Link to={`/work-items/${item.data.displayId}`}>
            {item.data.displayId}
          </Link>
          <h1>Edit ticket</h1>
        </div>
      </header>
      <WorkItemForm
        key={item.data.updatedAt}
        options={options.data}
        initialValues={valuesFromDetail(item.data)}
        showCreationStatus={false}
        includeAssignee={false}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        serverError={update.isError ? message : undefined}
        onSubmit={(values) => update.mutate(values)}
      />
    </div>
  );
}
