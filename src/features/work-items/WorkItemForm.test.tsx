import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemForm } from './WorkItemForm';

const options = {
  areas: [{ id: 'area', label: 'Synthetic Area', isActive: true }],
  labels: [{ id: 'label', label: 'Synthetic Label', isActive: true }],
  people: [{ id: 'person', label: 'Synthetic Designer' }],
  statuses: [{ code: 'backlog', label: 'Backlog' }],
};

describe('WorkItemForm', () => {
  it('keeps values after client validation and fixes creation status to Backlog', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(
      <WorkItemForm
        options={options}
        submitLabel="Create ticket"
        isSubmitting={false}
        onSubmit={submit}
      />,
    );
    await user.type(screen.getByLabelText('Title *'), 'Preserved title');
    await user.click(screen.getByRole('button', { name: 'Create ticket' }));
    expect(screen.getByLabelText('Title *')).toHaveValue('Preserved title');
    expect(screen.getByText('Choose an Area or Squad.')).toBeVisible();
    expect(screen.getByText('Backlog')).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits one Figma URL and the selected label without a status field', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(
      <WorkItemForm
        options={options}
        submitLabel="Create ticket"
        isSubmitting={false}
        onSubmit={submit}
      />,
    );
    await user.type(screen.getByLabelText('Title *'), 'Synthetic ticket');
    await user.selectOptions(screen.getByLabelText('Area / Squad *'), 'area');
    await user.type(
      screen.getByLabelText('Figma URL (optional)'),
      'https://www.figma.com/design/synthetic',
    );
    await user.click(screen.getByLabelText('Synthetic Label'));
    await user.click(screen.getByRole('button', { name: 'Create ticket' }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        areaId: 'area',
        figmaUrl: 'https://www.figma.com/design/synthetic',
        labelIds: ['label'],
      }),
    );
    expect(submit.mock.calls[0]?.[0]).not.toHaveProperty('status');
  });

  it('keeps Area editable and omits Assignee when reassignment is owned by the detail controls', () => {
    render(
      <WorkItemForm
        options={options}
        initialValues={{
          title: 'Synthetic ticket',
          description: '',
          areaId: 'area',
          assigneeId: 'person',
          plannedStartDate: '',
          dueDate: '',
          figmaUrl: '',
          labelIds: [],
        }}
        submitLabel="Save changes"
        isSubmitting={false}
        showCreationStatus={false}
        includeAssignee={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Area / Squad *')).toHaveValue('area');
    expect(
      screen.queryByLabelText('Assignee (optional)'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Backlog')).not.toBeInTheDocument();
  });

  it('keeps planned start and Next Deadline independent as required by the domain contract', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(
      <WorkItemForm
        options={options}
        submitLabel="Create ticket"
        isSubmitting={false}
        onSubmit={submit}
      />,
    );
    await user.type(screen.getByLabelText('Title *'), 'Independent dates');
    await user.selectOptions(screen.getByLabelText('Area / Squad *'), 'area');
    await user.type(screen.getByLabelText('Planned start'), '2026-08-20');
    await user.type(screen.getByLabelText('Next Deadline'), '2026-08-10');
    await user.click(screen.getByRole('button', { name: 'Create ticket' }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        plannedStartDate: '2026-08-20',
        dueDate: '2026-08-10',
      }),
    );
  });
});
