import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Accessibility,
  Bell,
  Download,
  Heart,
  Info,
  Lock,
  Mic,
  Sparkles,
  User as UserIcon,
  Users,
} from 'lucide-react-native';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { exportUserData } from '@/services/export';

type IconRef = typeof UserIcon;

export interface SettingsRow {
  Icon: IconRef;
  label: string;
  value?: string;
  badge?: string;
  toggleKey?: 'voiceOnly';
  onPress?: () => void;
}

export interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

const careTeamCount = (): number => {
  const team = useProfileStore.getState().onboardingAnswers.careTeam;
  return Array.isArray(team) ? team.length : 0;
};

const focusLabel = (): string => {
  const focus = useProfileStore.getState().onboardingAnswers.focus;
  return typeof focus === 'string' ? focus : 'Not set';
};

const subscriptionLabel = (status: string): string => {
  if (status === 'trial') return 'Trial';
  if (status === 'active') return 'Active';
  return 'Not subscribed';
};

/**
 * Builds the four grouped settings sections (Profile, Preferences,
 * Privacy & data, Subscription). Each row declares its own onPress so
 * the screen just renders.
 */
export const useSettingsSections = (): SettingsSection[] => {
  const router = useRouter();
  const recordings = useRecordingsStore((s) => s.recordings);
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);

  return [
    {
      title: 'Profile',
      rows: [
        {
          Icon: UserIcon,
          label: 'Personal info',
          value: 'You',
          onPress: () =>
            Alert.alert('Personal info', 'Profile editing coming soon.'),
        },
        {
          Icon: Users,
          label: 'Care team',
          value: `${careTeamCount()} clinicians`,
          onPress: () => router.push('/onboarding/care-team'),
        },
        {
          Icon: Heart,
          label: 'Focus area',
          value: focusLabel(),
          onPress: () => router.push('/onboarding/focus'),
        },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        {
          Icon: Bell,
          label: 'Notifications',
          value: 'On · Morning 9am',
          onPress: () =>
            Linking.openSettings?.() ??
            Alert.alert('Notifications', 'Configure in device Settings.'),
        },
        {
          Icon: Accessibility,
          label: 'Accessibility',
          value: 'Default',
          onPress: () => Alert.alert('Accessibility', 'Coming soon.'),
        },
        {
          Icon: Mic,
          label: 'Voice-only mode',
          toggleKey: 'voiceOnly',
        },
      ],
    },
    {
      title: 'Privacy & data',
      rows: [
        {
          Icon: Lock,
          label: 'Privacy settings',
          value: 'On-device only',
          onPress: () =>
            Alert.alert(
              'Privacy',
              'Voice is transcribed on-device. Only text you approve is sent to AI.',
            ),
        },
        {
          Icon: Download,
          label: `Export all data · ${recordings.length}`,
          value: 'JSON',
          onPress: exportUserData,
        },
        {
          Icon: Info,
          label: 'Medical disclaimer',
          onPress: () =>
            Alert.alert(
              'Not medical advice',
              'Sympnote is an organizational tool. Always consult your doctor for medical decisions.',
            ),
        },
      ],
    },
    {
      title: 'Subscription',
      rows: [
        {
          Icon: Sparkles,
          label: 'Sympnote Plus',
          value: subscriptionLabel(subscriptionStatus),
          badge:
            subscriptionStatus === 'trial' || subscriptionStatus === 'active'
              ? 'PLUS'
              : undefined,
          onPress: () =>
            Alert.alert('Manage subscription', 'Opens the store.'),
        },
      ],
    },
  ];
};
