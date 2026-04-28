import type { Brief, Recording } from '@/stores/types';

/**
 * The set of recordings that haven't been included in any prior brief.
 * Powers the home-screen "N notes not yet briefed" surface — a
 * concrete count that disappears when the user generates with the
 * default "since last brief" window.
 */
export const unbriefedRecordings = (
  allRecordings: Recording[],
  allBriefs: Brief[],
): Recording[] => {
  const used = new Set<string>();
  for (const b of allBriefs) {
    for (const id of b.sourceRecordingIds) used.add(id);
  }
  return allRecordings.filter((r) => !used.has(r.id));
};
