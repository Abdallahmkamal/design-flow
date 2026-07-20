import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Badge } from './Badge/Badge';
import { Checkbox } from './Checkbox/Checkbox';
import { DataTable } from './DataTable/DataTable';
import { Select } from './Select/Select';

describe('Phase 2 shared components', () => {
  it('keeps Badge as read-only visible metadata', () => {
    render(<Badge tone="info">Admin</Badge>);

    expect(screen.getByText('Admin')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('associates Select label, description, and validation', () => {
    render(
      <Select
        label="Position"
        description="Choose one position."
        error="Select a valid position."
        defaultValue=""
      >
        <option value="">Select position</option>
        <option value="designer">Designer</option>
      </Select>,
    );

    const select = screen.getByLabelText('Position');
    expect(select).toHaveAccessibleDescription(
      'Choose one position. Select a valid position.',
    );
    expect(select).toHaveAttribute('aria-invalid', 'true');
  });

  it('preserves native checkbox activation through its visible label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Checkbox
        label="Admin privilege"
        description="Independent from position."
        onChange={onChange}
      />,
    );

    await user.click(screen.getByText('Admin privilege'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders semantic desktop table and structured mobile records', () => {
    render(
      <DataTable
        caption="Synthetic directory"
        columns={[
          {
            key: 'name',
            header: 'Person',
            render: (row: { id: string; name: string }) => row.name,
          },
        ]}
        rows={[{ id: 'one', name: 'Synthetic Member' }]}
        getRowKey={(row) => row.id}
      />,
    );

    expect(
      screen.getByRole('table', { name: 'Synthetic directory' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Synthetic directory', { selector: 'ul' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Synthetic Member')).toHaveLength(2);
  });
});
