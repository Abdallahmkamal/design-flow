import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkItemExportPanel } from './WorkItemExportPanel';

const api = vi.hoisted(() => ({
  getExportCapabilities: vi.fn(),
  getWorkItemExport: vi.fn(),
}));
const download = vi.hoisted(() => vi.fn());
vi.mock('./reportsApi', () => api);
vi.mock('./workItemPdf', () => ({ downloadWorkItemPdf: download }));

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkItemExportPanel displayId="DF-000123" />
    </QueryClientProvider>,
  );

describe('WorkItemExportPanel', () => {
  beforeEach(() => {
    api.getExportCapabilities.mockReset();
    api.getWorkItemExport.mockReset();
    download.mockReset();
  });

  it('omits the control when the server denies PDF capability', async () => {
    api.getExportCapabilities.mockResolvedValue({
      canExportReports: false,
      canExportWorkItem: false,
    });
    renderPanel();
    await vi.waitFor(() =>
      expect(api.getExportCapabilities).toHaveBeenCalledOnce(),
    );
    expect(
      screen.queryByRole('button', { name: 'Export work item' }),
    ).not.toBeInTheDocument();
  });

  it('keeps comments off by default and downloads one authorized payload', async () => {
    const user = userEvent.setup();
    api.getExportCapabilities.mockResolvedValue({
      canExportReports: false,
      canExportWorkItem: true,
    });
    api.getWorkItemExport.mockResolvedValue({
      workItem: { displayId: 'DF-000123' },
    });
    download.mockResolvedValue(undefined);
    renderPanel();
    await user.click(
      await screen.findByRole('button', { name: 'Export work item' }),
    );
    expect(
      screen.getByRole('checkbox', { name: 'Include comments' }),
    ).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Download PDF' }));
    await vi.waitFor(() =>
      expect(api.getWorkItemExport).toHaveBeenCalledWith('DF-000123', false),
    );
    expect(download).toHaveBeenCalledOnce();
  });
});
