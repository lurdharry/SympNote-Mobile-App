import { Clipboard, History, Home, LineChart } from 'lucide-react-native';

export const TABS = [
  { name: 'home',     label: 'Home',     Icon: Home },
  { name: 'prep',     label: 'Briefs',   Icon: Clipboard },
  { name: 'insights', label: 'Insights', Icon: LineChart },
  { name: 'history',  label: 'History',  Icon: History },
] as const;
