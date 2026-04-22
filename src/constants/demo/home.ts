import { Activity, BadgeAlert, Pill } from 'lucide-react-native';

type QuickIconRef = typeof Pill;

export type QuickTile = {
  Icon: QuickIconRef;
  t: string;
  c: string;
  kind: string;
};

export type DemoEntry = {
  time: string;
  period: 'AM' | 'PM';
  text: string;
  tags: { t: string; c: string }[];
  dur?: string;
  kind: 'voice' | 'med';
};

/** Quick-log tile options shown above the home timeline. */
export const DEMO_QUICK_TILES: QuickTile[] = [
  { Icon: Pill,       t: 'Medication',  c: '#5A8F6E', kind: 'medication' },
  { Icon: Activity,   t: 'Symptom',     c: '#E07A5F', kind: 'symptom' },
  { Icon: BadgeAlert, t: 'Side effect', c: '#F6C06A', kind: 'side-effect' },
];

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
