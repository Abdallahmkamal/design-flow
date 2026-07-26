import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { Button, Checkbox } from '../../ui';
import { downloadWorkItemPdf } from './workItemPdf';
import { getExportCapabilities, getWorkItemExport } from './reportsApi';
import styles from './WorkItemExportPanel.module.css';

export function WorkItemExportPanel({ displayId }: { displayId: string }) {
  const [open, setOpen] = useState(false);
  const [includeComments, setIncludeComments] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const capability = useQuery({
    queryKey: ['export-capabilities'],
    queryFn: getExportCapabilities,
  });
  const download = useMutation({
    mutationFn: () => getWorkItemExport(displayId, includeComments),
    onSuccess: (payload) => downloadWorkItemPdf(payload),
  });
  useEffect(() => {
    if (!open && restoreFocus.current) {
      restoreFocus.current = false;
      trigger.current?.focus();
    }
  }, [open]);
  if (!capability.data?.canExportWorkItem) return null;
  if (!open)
    return (
      <Button ref={trigger} variant="secondary" onClick={() => setOpen(true)}>
        Export work item
      </Button>
    );
  return (
    <section
      className={styles.panel}
      aria-labelledby="work-item-export-heading"
    >
      <h2 id="work-item-export-heading">Export work item</h2>
      <Checkbox
        label="Include comments"
        checked={includeComments}
        onChange={(event) => setIncludeComments(event.currentTarget.checked)}
        description="Off by default. Withdrawn comment bodies are never exported."
      />
      <div className={styles.actions}>
        <Button
          isLoading={download.isPending}
          onClick={() => download.mutate()}
        >
          Download PDF
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            restoreFocus.current = true;
            setOpen(false);
          }}
        >
          Cancel
        </Button>
      </div>
      <p aria-live="polite">
        {download.isSuccess
          ? 'Work Item PDF downloaded.'
          : download.isError
            ? 'PDF generation failed. Try again.'
            : 'The PDF uses the visible, server-authorized Work Item snapshot and history.'}
      </p>
    </section>
  );
}
