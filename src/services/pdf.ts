import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Render a visit brief into a shareable PDF.
 *
 * Uses `expo-print` to generate HTML-to-PDF locally. The styling is
 * intentionally simple + printer-friendly: serif headings, hairline
 * section rules, tabular severity. No color blocks, no background
 * tints — a doctor's office should be able to print this on a B&W
 * printer and have it still read well.
 */
export type PdfConcern = {
  title: string;
  detail: string;
  severity: number;
};

export type PdfMed = {
  name: string;
  dose: string;
  freq: string;
  last: string;
};

export type PdfBrief = {
  doctor: string;
  specialty: string;
  dateLabel: string;
  timeLabel: string;
  concerns: PdfConcern[];
  timeline: string;
  questions: string[];
  meds: PdfMed[];
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(brief: PdfBrief): string {
  const concernsBlock =
    brief.concerns.length === 0
      ? ''
      : `
    <section>
      <h2>Concerns</h2>
      <table class="concerns">
        <tbody>
          ${brief.concerns
            .map(
              (c) => `
            <tr>
              <td class="name"><strong>${escapeHtml(c.title)}</strong><div class="detail">${escapeHtml(c.detail)}</div></td>
              <td class="sev">${c.severity}/10</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </section>`;

  const timelineBlock = brief.timeline
    ? `
    <section>
      <h2>Timeline</h2>
      <p>${escapeHtml(brief.timeline)}</p>
    </section>`
    : '';

  const questionsBlock =
    brief.questions.length === 0
      ? ''
      : `
    <section>
      <h2>Questions for the doctor</h2>
      <ol>
        ${brief.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}
      </ol>
    </section>`;

  const medsBlock =
    brief.meds.length === 0
      ? ''
      : `
    <section>
      <h2>Medications</h2>
      <table class="meds">
        <tbody>
          ${brief.meds
            .map(
              (m) => `
            <tr>
              <td><strong>${escapeHtml(m.name)} ${escapeHtml(m.dose)}</strong><div class="detail">${escapeHtml(m.freq)} · last ${escapeHtml(m.last)}</div></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </section>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Visit brief — ${escapeHtml(brief.doctor)}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
        color: #1A1F1E;
        font-size: 11pt;
        line-height: 1.45;
        padding: 36px 48px;
      }
      header { border-bottom: 1pt solid #1A1F1E; padding-bottom: 14px; margin-bottom: 20px; }
      .eyebrow {
        font-size: 9pt;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #5A6361;
        margin-bottom: 6px;
      }
      h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-weight: 500;
        font-size: 22pt;
        letter-spacing: -0.01em;
      }
      .when {
        margin-top: 4px;
        color: #5A6361;
        font-size: 10pt;
      }
      section { margin-top: 22px; page-break-inside: avoid; }
      h2 {
        font-family: Georgia, "Times New Roman", serif;
        font-weight: 500;
        font-size: 13pt;
        margin: 0 0 10px;
        border-bottom: 0.5pt solid #8A9290;
        padding-bottom: 4px;
      }
      p, li { margin: 0 0 6px; }
      ol { padding-left: 20px; }
      table { width: 100%; border-collapse: collapse; }
      .concerns td, .meds td { padding: 6px 0; vertical-align: top; border-bottom: 0.25pt solid #E0D9CC; }
      .concerns tr:last-child td, .meds tr:last-child td { border-bottom: none; }
      .concerns .name { width: 80%; }
      .concerns .sev { width: 20%; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
      .detail { font-size: 9.5pt; color: #5A6361; margin-top: 2px; }
      footer {
        margin-top: 28px;
        padding-top: 10px;
        border-top: 0.5pt solid #8A9290;
        font-size: 8.5pt;
        color: #8A9290;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="eyebrow">Visit Brief</div>
      <h1>${escapeHtml(brief.doctor)} — ${escapeHtml(brief.specialty)}</h1>
      <div class="when">${escapeHtml(brief.dateLabel)} · ${escapeHtml(brief.timeLabel)}</div>
    </header>

    ${concernsBlock}
    ${timelineBlock}
    ${questionsBlock}
    ${medsBlock}

    <footer>
      Shared from Sympnote. This is an organizational tool, not medical advice.
    </footer>
  </body>
</html>`;
}

/**
 * Generate the PDF and open the system share sheet. Returns the file
 * URI if the caller wants to do something else with it. Throws on
 * render failure — caller should Alert the error.
 */
export async function exportBriefPdf(brief: PdfBrief): Promise<string> {
  const html = renderHtml(brief);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
    // Letter-ish sizing at default DPI
    width: 612,
    height: 792,
    margins: { left: 36, right: 36, top: 36, bottom: 36 },
  });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Visit brief: ${brief.doctor}`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
