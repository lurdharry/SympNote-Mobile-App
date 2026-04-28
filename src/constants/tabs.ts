import { Clipboard, History, Home, LineChart, Settings } from 'lucide-react-native';

export const TABS = [
  { name: 'home',     label: 'Home',     Icon: Home },
  { name: 'prep',     label: 'Briefs',   Icon: Clipboard },
  { name: 'insights', label: 'Insights', Icon: LineChart },
  { name: 'history',  label: 'History',  Icon: History },
  { name: 'settings', label: 'Settings', Icon: Settings },
] as const;
