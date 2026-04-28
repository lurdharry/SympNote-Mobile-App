import { format, parseISO } from 'date-fns';
import type { Brief, Clinician } from '@/stores/types';

/**
 * Plain-text export for the first-class Brief entity. Header adapts
 * to the audience tag (clinicians, "Everyone", or just the window).
 */
export const formatBriefAsText = (brief: Brief, careTeam: Clinician[]): string => {
  const lines: string[] = [];

  const tagged = brief.clinicianIds
    .map((id) => careTeam.find((c) => c.id === id))
    .filter((c): c is Clinician => !!c);
  const audience =
    tagged.length === 0
      ? 'For everyone'
      : tagged.length === 1
        ? `For ${tagged[0]!.name} (${tagged[0]!.role})`
        : `For ${tagged.map((c) => c.name).join(', ')}`;

  lines.push(`Brief · ${brief.title ?? 'Symptom snapshot'}`);
  lines.push(audience);
  const start = format(parseISO(brief.windowStart), 'MMM d, yyyy');
  const end = format(parseISO(brief.windowEnd), 'MMM d, yyyy');
  lines.push(start === end ? start : `${start} – ${end}`);
  lines.push(`Generated ${format(parseISO(brief.generatedAt), 'PPP p')}`);
  lines.push('');

  const c = brief.content;

  if (c.summary) {
    lines.push(c.summary);
    lines.push('');
  }
  if (c.topConcerns.length > 0) {
    lines.push('TOP CONCERNS');
    c.topConcerns.forEach((it) => {
      const detail = it.detail ? `: ${it.detail}` : '';
      lines.push(`• ${it.label}${detail}`);
    });
    lines.push('');
  }
  if (c.timeline.length > 0) {
    lines.push('TIMELINE');
    c.timeline.forEach((t) => lines.push(`• ${t.date}: ${t.line}`));
    lines.push('');
  }
  if (c.patterns.length > 0) {
    lines.push('PATTERNS');
    c.patterns.forEach((p) => lines.push(`• ${p}`));
    lines.push('');
  }
  if (c.medications.length > 0) {
    lines.push('MEDICATIONS');
    c.medications.forEach((m) => lines.push(`• ${m}`));
    lines.push('');
  }
  if (c.questions.length > 0) {
    lines.push('QUESTIONS TO ASK');
    c.questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push('');
  }
  if (c.flags.length > 0) {
    lines.push('WORTH FLAGGING');
    c.flags.forEach((f) => lines.push(`⚠ ${f}`));
    lines.push('');
  }

  lines.push('Not medical advice. Review with your doctor.');
  return lines.join('\n').trim();
};

/** True when the brief has no usable content — the AI returned an
 *  empty shell. UI should surface a retry/regenerate path. */
export const isBriefContentEmpty = (brief: Brief): boolean => {
  const c = brief.content;
  return (
    !c.summary.trim() &&
    c.topConcerns.length === 0 &&
    c.timeline.length === 0 &&
    c.patterns.length === 0 &&
    c.medications.length === 0 &&
    c.questions.length === 0 &&
    c.flags.length === 0
  );
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const li = (s: string): string => `<li>${escapeHtml(s)}</li>`;

/**
 * Render the brief as a styled HTML document for printing to PDF
 * (expo-print). Layout reads as a clinician-facing one-pager:
 * masthead with audience + window, summary paragraph, then the
 * sections in clinical-scan order. Print CSS keeps margins tight,
 * fonts simple, and the disclaimer at the bottom.
 */
export const formatBriefAsHtml = (brief: Brief, careTeam: Clinician[]): string => {
  const tagged = brief.clinicianIds
    .map((id) => careTeam.find((c) => c.id === id))
    .filter((c): c is Clinician => !!c);
  const audience =
    tagged.length === 0
      ? 'For everyone'
      : `For ${tagged.map((c) => `${c.name} (${c.role})`).join(', ')}`;

  const start = format(parseISO(brief.windowStart), 'MMM d, yyyy');
  const end = format(parseISO(brief.windowEnd), 'MMM d, yyyy');
  const windowLine = start === end ? start : `${start} – ${end}`;
  const generated = format(parseISO(brief.generatedAt), 'PPP p');

  const c = brief.content;

  const sections: string[] = [];

  if (c.summary) {
    sections.push(`<section><p class="summary">${escapeHtml(c.summary)}</p></section>`);
  }
  if (c.topConcerns.length > 0) {
    const items = c.topConcerns
      .map(
        (it) =>
          `<li><strong>${escapeHtml(it.label)}</strong>${
            it.detail ? `: ${escapeHtml(it.detail)}` : ''
          }</li>`,
      )
      .join('');
    sections.push(`<section><h2>Top concerns</h2><ol>${items}</ol></section>`);
  }
  if (c.timeline.length > 0) {
    const items = c.timeline
      .map(
        (t) =>
          `<li><span class="date">${escapeHtml(t.date)}</span> · ${escapeHtml(t.line)}</li>`,
      )
      .join('');
    sections.push(`<section><h2>Timeline</h2><ul>${items}</ul></section>`);
  }
  if (c.patterns.length > 0) {
    sections.push(
      `<section><h2>Patterns</h2><ul>${c.patterns.map(li).join('')}</ul></section>`,
    );
  }
  if (c.medications.length > 0) {
    sections.push(
      `<section><h2>Medications</h2><ul>${c.medications.map(li).join('')}</ul></section>`,
    );
  }
  if (c.questions.length > 0) {
    sections.push(
      `<section><h2>Questions to ask</h2><ol>${c.questions.map(li).join('')}</ol></section>`,
    );
  }
  if (c.flags.length > 0) {
    sections.push(
      `<section><h2>Worth flagging</h2><ul class="flags">${c.flags.map(li).join('')}</ul></section>`,
    );
  }

  const title = brief.title ? escapeHtml(brief.title) : 'Symptom brief';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { margin: 28pt; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1A1A1A;
    line-height: 1.5;
    font-size: 11pt;
  }
  .masthead {
    border-bottom: 2pt solid #2C6E6B;
    padding-bottom: 12pt;
    margin-bottom: 18pt;
  }
  .eyebrow {
    font-size: 9pt;
    letter-spacing: 1.4pt;
    color: #2C6E6B;
    font-weight: 700;
    text-transform: uppercase;
  }
  h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-size: 22pt;
    margin: 4pt 0 10pt 0;
    letter-spacing: -0.3pt;
  }
  .meta {
    font-size: 10pt;
    color: #5A5A5A;
  }
  .meta strong { color: #1A1A1A; }
  h2 {
    font-size: 10pt;
    letter-spacing: 1.2pt;
    text-transform: uppercase;
    color: #5A5A5A;
    margin: 18pt 0 6pt 0;
  }
  section { page-break-inside: avoid; }
  .summary {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12pt;
    line-height: 1.55;
  }
  ul, ol { padding-left: 18pt; margin: 0; }
  li { margin-bottom: 4pt; }
  .date {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    color: #5A5A5A;
  }
  .flags li { color: #B45A3A; }
  footer {
    margin-top: 28pt;
    padding-top: 10pt;
    border-top: 1pt solid #C9BFA5;
    font-size: 9pt;
    color: #5A5A5A;
    font-style: italic;
  }
</style>
</head>
<body>
  <div class="masthead">
    <div class="eyebrow">Sympnote · Brief</div>
    <h1>${title}</h1>
    <div class="meta">
      <strong>${escapeHtml(audience)}</strong><br />
      ${escapeHtml(windowLine)} · ${brief.sourceRecordingIds.length} source ${
        brief.sourceRecordingIds.length === 1 ? 'note' : 'notes'
      }<br />
      Generated ${escapeHtml(generated)}
    </div>
  </div>
  ${sections.join('\n')}
  <footer>
    Organisational summary based on the patient's logged notes. Not medical advice. Review with your clinician.
  </footer>
</body>
</html>`;
};
