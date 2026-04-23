import { format, parseISO } from 'date-fns';
import type { Appointment, AppointmentBrief } from '@/stores/types';

/**
 * Render the full structured brief as plain text for Copy / Share.
 * Keeps the sections in a predictable order a doctor can scan linearly.
 */
export const briefToPlainText = (
  appointment: Appointment,
  brief: AppointmentBrief,
): string => {
  const lines: string[] = [];

  lines.push(`Visit brief · ${appointment.doctorName} (${appointment.specialty})`);
  lines.push(format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy'));
  lines.push('');

  if (brief.summary) {
    lines.push(brief.summary);
    lines.push('');
  }

  if (brief.topConcerns.length > 0) {
    lines.push('TOP CONCERNS');
    brief.topConcerns.forEach((c) => {
      const detail = c.detail ? `: ${c.detail}` : '';
      lines.push(`• ${c.label}${detail}`);
    });
    lines.push('');
  }

  if (brief.timeline.length > 0) {
    lines.push('TIMELINE');
    brief.timeline.forEach((t) => lines.push(`• ${t.date}: ${t.line}`));
    lines.push('');
  }

  if (brief.patterns.length > 0) {
    lines.push('PATTERNS');
    brief.patterns.forEach((p) => lines.push(`• ${p}`));
    lines.push('');
  }

  if (brief.medications.length > 0) {
    lines.push('MEDICATIONS');
    brief.medications.forEach((m) => lines.push(`• ${m}`));
    lines.push('');
  }

  if (brief.questions.length > 0) {
    lines.push('QUESTIONS TO ASK');
    brief.questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push('');
  }

  if (brief.flags.length > 0) {
    lines.push('WORTH FLAGGING');
    brief.flags.forEach((f) => lines.push(`⚠ ${f}`));
    lines.push('');
  }

  lines.push('Not medical advice. Review with your doctor.');

  return lines.join('\n').trim();
};
