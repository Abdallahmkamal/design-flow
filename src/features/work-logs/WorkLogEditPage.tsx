import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import {
  correctWorkLog,
  getWorkLogBatch,
  withdrawWorkLog,
  type WorkLogBatch,
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

export function WorkLogEditPage() {
  const { batchId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const batch = useQuery({
    queryKey: ['work-log-batch', batchId],
    queryFn: () => getWorkLogBatch(batchId),
  });
  const [draft, setDraft] = useState<WorkLogBatch | null>(null);
  const source = draft ?? batch.data;
  const save = useMutation({ mutationFn: correctWorkLog });
  const withdraw = useMutation({ mutationFn: withdrawWorkLog });
  if (batch.isPending) return <p role="status">Loading work log…</p>;
  if (!source?.canCorrect)
    return (
      <main className={styles.page}>
        <p role="alert">
          This work log is unavailable or you cannot correct it.
        </p>
        <Link to="/work-items">Return to All Tickets</Link>
      </main>
    );
  const workTypes = source.context === 'ticket' ? ticketTypes : visualTypes;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await save.mutateAsync(source);
      await client.invalidateQueries({ queryKey: ['work-items'] });
      void navigate('/work-items');
    } catch {
      /* preserve draft */
    }
  };
  const updateEntry = (
    id: string,
    patch: Partial<WorkLogBatch['entries'][number]>,
  ) =>
    setDraft({
      ...source,
      entries: source.entries.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    });
  return (
    <main className={styles.page}>
      <header>
        <Link to="/work-items">All Tickets</Link>
        <h1>Correct work log</h1>
        <p>Corrections are audited; withdrawal cannot be restored.</p>
      </header>
      <form className={styles.form} onSubmit={submit}>
        <fieldset className={styles.rows}>
          <legend>Actual work dates</legend>
          {source.entries.map((entry, index) => (
            <div className={styles.row} key={entry.id}>
              <Input
                label={`Work date ${index + 1}`}
                type="date"
                value={entry.workDate}
                required
                onChange={(event) =>
                  updateEntry(entry.id, { workDate: event.target.value })
                }
              />
              <Select
                label={`Work type code ${index + 1}`}
                value={entry.workTypeCode}
                required
                onChange={(event) =>
                  updateEntry(entry.id, { workTypeCode: event.target.value })
                }
              >
                {workTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Textarea
                label={`Optional detail ${index + 1}`}
                value={entry.description}
                onChange={(event) =>
                  updateEntry(entry.id, { description: event.target.value })
                }
              />
            </div>
          ))}
        </fieldset>
        <div className={styles.actions}>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save correction'}
          </Button>
          {source.canWithdraw ? (
            <Button
              type="button"
              variant="destructive"
              disabled={withdraw.isPending}
              onClick={() => {
                if (confirm('Withdraw this work log? This cannot be restored.'))
                  void withdraw
                    .mutateAsync(source)
                    .then(() => navigate('/work-items'));
              }}
            >
              Withdraw work log
            </Button>
          ) : null}
        </div>
        {save.error || withdraw.error ? (
          <p role="alert">
            The change could not be completed. Your draft remains available.
          </p>
        ) : null}
      </form>
    </main>
  );
}
