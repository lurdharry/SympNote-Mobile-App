export type ConcernDemo = { t: string; s: string; sev: number };
export type SeverityPoint = { d: string; v: number };
export type MedDemo = { name: string; dose: string; freq: string; last: string };

export type PrepContent = {
  concerns: ConcernDemo[];
  timeline: string;
  severity: SeverityPoint[];
  meds: MedDemo[];
  questions: string[];
};

/** Demo appointments rendered in Prep when the user has none attached. */
export const DEMO_APPTS = [
  {
    id: 'demo-0',
    doc: 'Dr. Chen',
    spec: 'Rheumatology',
    date: 'Nov 28',
    time: '2:00 PM',
    inDays: 7,
    color: '#2C6E6B',
  },
  {
    id: 'demo-1',
    doc: 'Dr. Patel',
    spec: 'Primary Care',
    date: 'Dec 12',
    time: '10:30 AM',
    inDays: 21,
    color: '#E07A5F',
  },
] as const;

export const DEMO_PREP_CONTENT: Record<string, PrepContent> = {
  'demo-0': {
    concerns: [
      { t: 'Right knee pain',    s: '2 weeks, worsening',      sev: 7 },
      { t: 'Morning stiffness',  s: 'After waking, ~30min',    sev: 5 },
      { t: 'Afternoon fatigue',  s: 'Despite 7–8h sleep',      sev: 6 },
    ],
    timeline:
      'Started ~Nov 6. Gradual onset, no injury. Stairs trigger sharpest pain. Progressively more frequent over the past 10 days.',
    severity: [
      { d: 'Nov 12', v: 4 }, { d: 'Nov 13', v: 5 }, { d: 'Nov 14', v: 7 },
      { d: 'Nov 15', v: 6 }, { d: 'Nov 16', v: 5 }, { d: 'Nov 17', v: 8 },
      { d: 'Nov 18', v: 6 }, { d: 'Nov 19', v: 5 }, { d: 'Nov 20', v: 7 },
      { d: 'Nov 21', v: 4 },
    ],
    meds: [
      { name: 'Ibuprofen', dose: '400mg', freq: 'As needed', last: 'Today, 9am' },
    ],
    questions: [
      'Should I get imaging (MRI) for the knee?',
      'Could the fatigue be related to the joint symptoms?',
      'Anti-inflammatory options other than ibuprofen?',
      'Is physical therapy worth trying first?',
      'Any labs I should request?',
    ],
  },
  'demo-1': {
    concerns: [
      { t: 'Annual wellness check', s: 'Routine visit', sev: 2 },
    ],
    timeline: 'Routine annual physical.',
    severity: [],
    meds: [],
    questions: [
      'Update on vaccines',
      'Blood work results from last visit',
      'Sleep hygiene recommendations',
    ],
  },
};
