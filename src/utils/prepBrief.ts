import type { PrepRow } from '@/hooks/usePrepRows';

/**
 * Render a visit brief as plain text for Share / Export. Sections are
 * included only if they have content so the reader sees a focused
 * one-pager rather than placeholder headings.
 */
export const renderBrief = (row: PrepRow): string => {
  const lines: string[] = [];
  lines.push(`Visit brief. ${row.doc}, ${row.spec}`);
  lines.push(`${row.dateLabel} · ${row.timeLabel}`);
  lines.push('');

  if (row.content.concerns.length > 0) {
    lines.push('Concerns');
    row.content.concerns.forEach((c) => {
      lines.push(`  • ${c.t} (${c.sev}/10). ${c.s}`);
    });
    lines.push('');
  }

  if (row.content.timeline) {
    lines.push('Timeline');
    lines.push(`  ${row.content.timeline}`);
    lines.push('');
  }

  if (row.content.questions.length > 0) {
    lines.push('Questions for your doctor');
    row.content.questions.forEach((q, i) => lines.push(`  ${i + 1}. ${q}`));
    lines.push('');
  }

  if (row.content.meds.length > 0) {
    lines.push('Medications');
    row.content.meds.forEach((m) => {
      lines.push(`  • ${m.name} ${m.dose}. ${m.freq}. Last: ${m.last}.`);
    });
    lines.push('');
  }

  lines.push('Shared from Sympnote. Organizational tool, not medical advice.');
  return lines.join('\n');
};
