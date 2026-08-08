import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkflowOverlay } from './WorkflowOverlay';

describe('WorkflowOverlay', () => {
  it('dismisses an untouched workflow with Escape', async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    render(
      <WorkflowOverlay
        title="Log work"
        description="Record work"
        footer={<button>Submit</button>}
        onDismiss={dismiss}
      >
        <input aria-label="Work date" />
      </WorkflowOverlay>,
    );
    expect(screen.getByRole('dialog', { name: 'Log work' })).toBeVisible();
    await user.keyboard('{Escape}');
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('keeps a dirty workflow open until discard is confirmed', async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    render(
      <WorkflowOverlay
        title="Create ticket"
        description="Create a ticket"
        isDirty
        footer={<button>Create</button>}
        onDismiss={dismiss}
      >
        <input aria-label="Title" />
      </WorkflowOverlay>,
    );
    await user.click(
      screen.getByRole('button', { name: 'Close Create ticket' }),
    );
    expect(
      screen.getByRole('alertdialog', { name: 'Discard this draft?' }),
    ).toBeVisible();
    expect(dismiss).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Close Create ticket' }),
    );
    await user.click(screen.getByRole('button', { name: 'Discard draft' }));
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('protects an in-flight workflow from dismissal', async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();
    render(
      <WorkflowOverlay
        title="Log work"
        description="Record work"
        isBusy
        footer={<button>Submitting</button>}
        onDismiss={dismiss}
      >
        <p>Submitting…</p>
      </WorkflowOverlay>,
    );
    expect(
      screen.getByRole('button', { name: 'Close Log work' }),
    ).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(dismiss).not.toHaveBeenCalled();
  });
});
