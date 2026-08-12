import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from './DataTable/DataTable';
import { Pagination } from './Pagination/Pagination';
import { Popover } from './Popover/Popover';
import { Textarea } from './Textarea/Textarea';
import { Tooltip } from './Tooltip/Tooltip';

describe('Phase 3 shared components', () => {
  it('associates Textarea help and validation while preserving native input', () => {
    render(
      <Textarea
        label="Description"
        description="Add useful context."
        error="Description is required."
        defaultValue="Preserved"
      />,
    );
    const field = screen.getByLabelText('Description');
    expect(field).toHaveValue('Preserved');
    expect(field).toHaveAccessibleDescription(
      'Add useful context. Description is required.',
    );
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a tooltip for focus and dismisses it with Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Open the independent Figma link">
        <a href="https://www.figma.com">Figma</a>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Open the independent Figma link',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('exposes Popover expanded state, focus entry, and Escape focus return', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        label="Contributors"
        trigger={<button type="button">2 contributors</button>}
      >
        <button type="button">Synthetic Person</button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: '2 contributors' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('dialog', { name: 'Contributors' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Close Contributors' }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'Synthetic Person' }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'Close Contributors' }),
    ).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('announces server-backed pagination and disables boundaries', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        page={1}
        pageSize={25}
        totalCount={52}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByText('1–25 of 52')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Page 1' }).className).toMatch(
      /currentPage/u,
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('supports sortable headers, pointer row activation, and custom mobile cards', async () => {
    const user = userEvent.setup();
    const sort = vi.fn();
    const activate = vi.fn();
    render(
      <DataTable
        caption="Tickets"
        columns={[
          {
            key: 'title',
            header: 'Title',
            sortDirection: 'ascending',
            onSort: sort,
            render: (row: { id: string; title: string }) => row.title,
          },
        ]}
        rows={[{ id: 'one', title: 'Synthetic ticket' }]}
        getRowKey={(row) => row.id}
        getRowAriaLabel={(row) => `Open ${row.title}`}
        onRowActivate={activate}
        renderMobileCard={(row) => <article>{row.title} mobile</article>}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Title/ }));
    expect(sort).toHaveBeenCalledOnce();
    const row = screen.getAllByRole('row')[1]!;
    await user.click(row);
    expect(activate).toHaveBeenCalledWith({
      id: 'one',
      title: 'Synthetic ticket',
    });
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveAccessibleName('Open Synthetic ticket');
    row.focus();
    await user.keyboard('{Enter}');
    expect(activate).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Synthetic ticket mobile')).toBeInTheDocument();
  });
});
