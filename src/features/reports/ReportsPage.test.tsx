import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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
    expect(
      await screen.findByText(
        'No controlled source records match these filters.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Export CSV' }),
    ).not.toBeInTheDocument();
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
});
