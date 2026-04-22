import { Lock, Mic, Send, Sparkles } from 'lucide-react-native';
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
    note: 'Just $4.99/month',
    badge: 'BEST VALUE · SAVE 50%',
  },
];

type IconRef = typeof Mic;

export const PLAN_FEATURES: Array<{ Icon: IconRef; t: string }> = [
  { Icon: Mic,      t: 'Unlimited voice notes' },
  { Icon: Sparkles, t: 'AI summary for every appointment' },
  { Icon: Lock,     t: 'Private & encrypted' },
  { Icon: Send,     t: 'Export to your doctor' },
];
