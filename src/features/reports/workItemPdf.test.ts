import { describe, expect, it } from 'vitest';

import { generateWorkItemPdf } from './workItemPdf';

describe('Work Item PDF', () => {
  it('creates a PDF with the stable filename from sanitized data', async () => {
    const output = await generateWorkItemPdf({
      generatedAt: '2026-07-26T10:00:00Z',
      generatedBy: 'Synthetic Lead',
      includeComments: false,
      workItem: {
        displayId: 'DF-000123',
        title: 'Synthetic report ticket',
        figmaUrl: 'https://www.figma.com/design/synthetic',
        blockerHistory: [],
        subtasks: [],
      },
      history: { workDates: [{ date: '2026-07-24' }], events: [] },
      comments: [],
    });
    expect(new TextDecoder().decode(output.bytes.slice(0, 4))).toBe('%PDF');
    expect(output.filename).toBe('work-item_DF-000123_2026-07-26.pdf');
  });
});
