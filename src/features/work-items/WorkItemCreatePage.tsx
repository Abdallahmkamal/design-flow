import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthentication } from '../auth/authContext';
import { Button } from '../../ui/Button/Button';
import { WorkItemForm } from './WorkItemForm';
import {
  createWorkItem,
  getWorkItemOptions,
  WorkItemApiError,
} from './workItemsApi';
import styles from './WorkItems.module.css';

const errorMessage = (error: Error | null) =>
  error instanceof WorkItemApiError && error.code === 'DF_CONFLICT'
    ? 'This ticket changed before the request completed. Your entries are preserved; review and try again.'
    : 'Design Flow could not save this ticket. Your entries are preserved.';

export function WorkItemCreatePage() {
  const { account } = useAuthentication();
  const navigate = useNavigate();
  const options = useQuery({
    queryKey: ['work-item-options'],
    queryFn: getWorkItemOptions,
  });
  const create = useMutation({
    mutationFn: createWorkItem,
    onSuccess: (result) =>
      navigate(`/work-items/${result.display_id}`, {
        state: { confirmation: `${result.display_id} created in Backlog.` },
      }),
  });

  if (account?.positionCode === 'viewer')
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Permission state</p>
            <h1>Create ticket</h1>
          </div>
        </header>
        <div className={styles.state} role="status">
          <p>Viewers can review Work Items but cannot create them.</p>
          <Link to="/work-items">Return to All Tickets</Link>
        </div>
      </div>
    );
  if (options.isPending)
    return (
      <div className={styles.state} role="status">
        Loading ticket fields…
      </div>
    );
  if (options.isError)
    return (
      <div className={styles.state} role="alert">
        <p>Design Flow could not load ticket fields.</p>
        <Button variant="secondary" onClick={() => void options.refetch()}>
          Retry
        </Button>
      </div>
    );

  return (
    <div className={styles.narrowPage}>
      <header className={styles.pageHeader}>
        <div>
          <Link to="/work-items">All Tickets</Link>
          <h1>Create ticket</h1>
          <p>
            Create a Backlog ticket. Logging work and non-Backlog transitions
            are intentionally unavailable here.
          </p>
        </div>
      </header>
      <WorkItemForm
        options={options.data}
        submitLabel="Create ticket"
        isSubmitting={create.isPending}
        serverError={create.isError ? errorMessage(create.error) : undefined}
        onSubmit={(values) => create.mutate(values)}
      />
    </div>
  );
}
