import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  isSameDay as dfIsSameDay,
  parseISO,
} from 'date-fns';

const toDate = (iso: string): Date => parseISO(iso);

export const formatDate = (iso: string): string => format(toDate(iso), 'MMM d, yyyy');

export const formatTime = (iso: string): string => format(toDate(iso), 'h:mm a');

export const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatRelative = (iso: string): string => {
  const then = toDate(iso);
  const now = new Date();
  const min = differenceInMinutes(now, then);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = differenceInHours(now, then);
  if (hr < 24) return `${hr}h ago`;
  const day = differenceInCalendarDays(now, then);
  if (day < 7) return `${day}d ago`;
  return formatDate(iso);
};

export const isSameDay = (a: string, b: string): boolean =>
  dfIsSameDay(toDate(a), toDate(b));

export const daysUntil = (iso: string): number =>
  differenceInCalendarDays(toDate(iso), new Date());

/**
 * Time-of-day greeting suitable for a serif display at the top of Home.
 * Morning 5–11, Afternoon 12–16, Evening otherwise.
 */
export const timeGreeting = (at: Date = new Date()): string => {
  const h = at.getHours();
  if (h >= 5 && h < 12) return 'Good morning.';
  if (h >= 12 && h < 17) return 'Good afternoon.';
  return 'Good evening.';
};
