export type DemoEntry = {
  time: string;
  period: 'AM' | 'PM';
  text: string;
  tags: { t: string; c: string }[];
  dur?: string;
  kind: 'voice' | 'med';
};

/** Demo today-entries rendered on Home when the user has no real logs. */
export const DEMO_TODAY_ENTRIES: DemoEntry[] = [
  {
    time: '10:42',
    period: 'AM',
    text: 'Morning knee pain, 6/10, worse climbing stairs.',
    tags: [{ t: 'knee', c: '#E07A5F' }],
    dur: '1:24',
    kind: 'voice',
  },
  {
    time: '08:15',
    period: 'AM',
    text: 'Fatigue returning — slept ~6h, groggy through breakfast.',
    tags: [
      { t: 'fatigue', c: '#F6C06A' },
      { t: 'sleep', c: '#5A8F6E' },
    ],
    dur: '0:48',
    kind: 'voice',
  },
  {
    time: '07:30',
    period: 'AM',
    text: 'Methotrexate 15mg + folic acid.',
    tags: [{ t: 'meds', c: '#5A8F6E' }],
    kind: 'med',
  },
];
