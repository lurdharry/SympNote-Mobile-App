import { TAG_PALETTE } from '@/constants/palette';

/**
 * Deterministic color for a tag name. A stable hash keeps "fatigue"
 * looking the same across sessions, so users learn to recognize their
 * own tags by color.
 */
export const colorForTag = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length]!;
};
