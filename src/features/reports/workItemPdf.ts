import { transformWorkItemPdfPayload } from './workItemPdfModel';

export async function generateWorkItemPdf(payload: unknown) {
  const content = transformWorkItemPdfPayload(payload);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: false });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = width - margin * 2;
  const renderedText: string[] = [];
  let y = 64;

  const ensure = (needed = 32) => {
    if (y + needed <= height - 54) return;
    doc.addPage();
    y = 64;
  };

  const write = (
    text: string,
    options: { bold?: boolean; size?: number; gap?: number } = {},
  ) => {
    const size = options.size ?? 10;
    const lineHeight = size + 5;
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    ensure(lines.length * lineHeight + (options.gap ?? 5));
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
    doc.text(lines, margin, y);
    renderedText.push(text);
    y += lines.length * lineHeight + (options.gap ?? 5);
  };

  const sectionHeading = (title: string) => {
    ensure(30);
    if (y > 72) {
      doc.setDrawColor(210, 210, 210);
      doc.line(margin, y - 5, width - margin, y - 5);
      y += 8;
    }
    write(title, { bold: true, size: 13, gap: 8 });
  };

  write(`${content.reference} — ${content.title}`, {
    bold: true,
    size: 18,
    gap: 10,
  });
  write(`Generated ${content.generatedAt} by ${content.generatedBy}.`, {
    gap: 8,
  });

  if (content.figmaUrl) {
    ensure(22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 79, 140);
    doc.textWithLink('Open Figma', margin, y, { url: content.figmaUrl });
    renderedText.push('Open Figma');
    y += 22;
  }

  for (const section of content.sections) {
    sectionHeading(section.title);
    if (!section.entries.length) {
      write('None');
      continue;
    }
    for (const entry of section.entries) {
      ensure(28);
      write(entry.title, { bold: true, gap: 3 });
      for (const line of entry.lines) write(line, { gap: 3 });
      y += 6;
    }
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(`${content.reference} · Work Item export`, margin, 28);
    doc.text(`Page ${page} of ${pages}`, width - margin, height - 24, {
      align: 'right',
    });
  }

  return {
    bytes: new Uint8Array(doc.output('arraybuffer')),
    filename: `work-item_${content.reference}_${content.generatedDateKey || 'generated'}.pdf`,
    textContent: renderedText.join('\n'),
  };
}

export async function downloadWorkItemPdf(payload: unknown) {
  const output = await generateWorkItemPdf(payload);
  const url = URL.createObjectURL(
    new Blob([output.bytes], { type: 'application/pdf' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = output.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
