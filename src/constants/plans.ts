import { Bell, ClipboardList, Lock, Mic, Sparkles } from 'lucide-react-native';
import { Plan } from '../services/subscription';

export type PlanDef = {
  id: Plan['id'];
  label: string;
  price: string;
  per: string;
  note?: string;
  badge?: string;
};

export const PAYWALL_PLANS: PlanDef[] = [
  { id: 'weekly',  label: 'Weekly',  price: '$4.99',  per: '/week' },
  { id: 'monthly', label: 'Monthly', price: '$9.99',  per: '/month' },
  {
    id: 'annual',
    label: 'Annual',
    price: '$59.99',
    per: '/year',
    note: '$4.99 a month',
    badge: 'BEST VALUE · SAVE 50%',
  },
];

type IconRef = typeof Mic;

export const PLAN_FEATURES: Array<{ Icon: IconRef; t: string }> = [
  { Icon: Mic,           t: 'Unlimited voice notes' },
  { Icon: Sparkles,      t: 'Doctor-ready notes for every recording' },
  { Icon: ClipboardList, t: 'Visit briefs for every clinician' },
  { Icon: Bell,          t: 'Appointment reminders' },
  { Icon: Lock,          t: 'Private on your device' },
];
