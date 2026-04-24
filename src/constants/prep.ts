export type PrepSectionId = 'summary' | 'chart' | 'questions' | 'meds';

export interface PrepSectionTab {
  id: PrepSectionId;
  label: string;
}

export const PREP_SECTION_TABS: readonly PrepSectionTab[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'chart', label: 'Severity' },
  { id: 'questions', label: 'Questions' },
  { id: 'meds', label: 'Meds' },
] as const;
