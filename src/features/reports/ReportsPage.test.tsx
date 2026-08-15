import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReportsPage } from './ReportsPage';

const api = vi.hoisted(() => ({
  getReports: vi.fn(),
  getReportOptions: vi.fn(),
  exportReportRows: vi.fn(),
}));
vi.mock('./reportsApi', async (original) => ({
  ...(await original()),
  ...api,
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Bar: () => null,
  Cell: () => null,
  Line: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const empty = {
  tab: 'tickets',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-26',
  snapshotAt: '2026-07-26',
  defaultScopeKey: 'all',
  selectedScopeKey: 'all',
  selectedPeople: [],
  scopeOptions: [{ key: 'all', label: 'All' }],
  peopleOptions: [],
  areaOptions: [],
  canExport: false,
  cards: { ticketsWorkedOn: 0 },
  cardSources: { ticketsWorkedOn: [] },
  charts: { activityOverTime: [] },
  rows: [],
  recordedActivity: [],
  visualActivity: [],
  designerTickets: [],
  totalCount: 0,
  page: 1,
  pageSize: 25,
};

describe('ReportsPage', () => {
  beforeEach(() => {
    api.getReports.mockReset().mockResolvedValue(empty);
    api.getReportOptions.mockReset().mockResolvedValue({
      statuses: [],
      labels: [],
      ticketWorkTypes: [],
      visualWorkTypes: [],
    });
  });

  it('shows explainable empty source and hides unauthorized CSV controls', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports']}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: 'Reports' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByText('No controlled source records match these filters.'),
      ).toBeVisible(),
    );
    expect(
      screen.queryByRole('button', { name: 'Export CSV' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(api.getReports.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
    const snapshot = (
      await screen.findByText('Snapshot as of 2026-07-26.')
    ).closest('p');
    expect(snapshot?.children).toHaveLength(2);
  });

  it('switches report tabs with the accessible tab control', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports']}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(await screen.findByRole('tab', { name: 'Designers' }));
    expect(screen.getByRole('tab', { name: 'Designers' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('keeps filter edits as a draft until they are applied', async () => {
    const user = userEvent.setup();
    api.getReports.mockResolvedValue({
      ...empty,
      canExport: true,
      areaOptions: [{ id: 'area-1', name: 'Care Tools' }],
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter
          initialEntries={[
            '/reports?tab=tickets&periodStart=2026-07-01&periodEnd=2026-07-26&scope=all&area=area-1',
          ]}
        >
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Area/Squad: Care Tools')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Edit filters' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Area/Squad: Care Tools')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Edit filters' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Area/Squad: Care Tools'),
      ).not.toBeInTheDocument(),
    );
  });

  it('reveals matching metric source items without replacing the date label', async () => {
    const user = userEvent.setup();
    api.getReports.mockResolvedValue({
      ...empty,
      cards: { ticketsWorkedOn: 1 },
      cardSources: {
        ticketsWorkedOn: [
          {
            key: 'ticket-1',
            primary: 'DF-000001 · Synthetic report ticket',
            secondary: '2 work entries',
          },
        ],
      },
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports']}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(api.getReports.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
    const metricCard = await screen.findByRole('button', {
      name: /Tickets worked on: 1\. Show matching source items/,
    });
    expect(await screen.findByText('During selected period')).toBeVisible();
    await user.hover(metricCard);
    expect(
      screen.getByText('DF-000001 · Synthetic report ticket'),
    ).toBeVisible();
    expect(screen.getByText('2 work entries')).toBeVisible();
    expect(screen.getByText('During selected period')).toBeVisible();
    await user.unhover(metricCard);
    await waitFor(() =>
      expect(
        screen.queryByText('DF-000001 · Synthetic report ticket'),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(metricCard);
    expect(
      await screen.findByText('DF-000001 · Synthetic report ticket'),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'View source' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'View controlled source records' }),
    ).not.toBeInTheDocument();
  });

  it('does not reserve summary-card space when a report has no cards', async () => {
    api.getReports.mockResolvedValue({ ...empty, tab: 'designers', cards: {} });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports?tab=designers']}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const heading = await screen.findByRole('heading', {
      name: 'Report summary',
    });
    expect(heading.parentElement?.children).toHaveLength(2);
  });

  it('renders controlled source rows as collapsed expandable mobile records', async () => {
    const user = userEvent.setup();
    api.getReports.mockResolvedValue({
      ...empty,
      rows: [
        {
          id: 'ticket-1',
          displayId: 'DF-000001',
          title: 'Synthetic report ticket',
          area: 'Care Tools',
          status: 'In Progress',
          assignee: 'Designer',
          activeWorkDays: 2,
          workEntries: 3,
        },
      ],
      totalCount: 1,
    });
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports']}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByText('1 matching record.');
    await waitFor(() =>
      expect(api.getReports.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
    const record = await waitFor(() => {
      const found = [...container.querySelectorAll('summary')]
        .find((node) => node.textContent?.includes('DF-000001'))
        ?.closest('details');
      expect(found).toBeDefined();
      return found!;
    });
    expect(record).not.toHaveAttribute('open');
    await user.click(record.querySelector('summary')!);
    expect(record).toHaveAttribute('open');
    const openLink = [...(record?.querySelectorAll('a') ?? [])].find(
      (link) => link.textContent === 'Open Work Item',
    );
    expect(openLink).toHaveAttribute('href', '/work-items/DF-000001');
  });

  it('keeps chart values semantic and offers one Filter by chooser per chart', async () => {
    const user = userEvent.setup();
    api.getReports.mockResolvedValue({
      ...empty,
      charts: {
        statusDistribution: [
          { label: 'In Progress', count: 2 },
          { label: 'Done', count: 1 },
        ],
      },
    });
    api.getReportOptions.mockResolvedValue({
      statuses: [{ value: 'in_progress', label: 'In Progress' }],
      labels: [],
      ticketWorkTypes: [],
      visualWorkTypes: [],
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/reports']}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(api.getReports.mock.calls.length).toBeGreaterThanOrEqual(2),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Filter by' })).toBeVisible(),
    );
    expect(
      screen.queryByRole('button', { name: 'Filter to In Progress' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('rowheader', { name: 'In Progress' }),
      ).toBeVisible(),
    );
    await user.click(screen.getByRole('button', { name: 'Filter by' }));
    expect(screen.getByRole('button', { name: 'In Progress' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'In Progress' }));
    await waitFor(() =>
      expect(api.getReports).toHaveBeenLastCalledWith(
        expect.objectContaining({ statuses: ['in_progress'] }),
      ),
    );
  });
});
