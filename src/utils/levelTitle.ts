/**
 * Honest, flavor-only title tied to the user's level. The app never
 * promises anything based on this — it's just a friendlier header than
 * "Level 3".
 */
export const levelTitle = (level: number): string => {
  if (level <= 1) return 'Getting started';
  if (level <= 3) return 'Health Historian';
  if (level <= 6) return 'Pattern Finder';
  if (level <= 10) return 'Visit-Ready';
  return 'Prep Master';
};
