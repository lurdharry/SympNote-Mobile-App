import { Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Download,
  Heart,
  Info,
  Lock,
  Sparkles,
  Trash2,
  User as UserIcon,
  Users,
} from 'lucide-react-native';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { usePendingRecordingStore } from '@/stores/usePendingRecordingStore';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { hapticSuccess } from '@/services/haptics';
import type {
  AgeBand,
  FocusArea,
  PersonalizationProfile,
  SubscriptionStatus,
} from '@/stores/types';
import { exportUserData } from '@/services/export';

type IconRef = typeof UserIcon;

export interface SettingsRow {
  Icon: IconRef;
  label: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
  /** Optional override for the row's icon tile and icon tint. Used
   *  by destructive rows to signal consequence without painting the
   *  whole row red. */
  tint?: string;
}

export interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

const IOS_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const ANDROID_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

const AGE_LABELS: Record<AgeBand, string> = {
  teen: '12 to 17',
  '18-29': '18 to 29',
  '30-49': '30 to 49',
  '50-64': '50 to 64',
  '65-plus': '65 or older',
};

const FOCUS_LABELS: Record<FocusArea, string> = {
  investigate: 'Investigating a symptom',
  'upcoming-visit': 'Upcoming visit',
  patterns: 'Catching patterns',
  'recovery-track': 'Tracking recovery',
  'mental-health': 'Mental health',
  general: 'General journal',
};

const formatFocus = (focus: FocusArea[]): string => {
  if (focus.length === 0) return 'Not set';
  if (focus.length <= 2) return focus.map((f) => FOCUS_LABELS[f]).join(', ');
  return `${focus.length} areas`;
};

const subscriptionLabel = (status: SubscriptionStatus): string => {
  if (status === 'trial') return 'Trial';
  if (status === 'active') return 'Active';
  return 'Not subscribed';
};

const clearAllContent = () => {
  Alert.alert(
    'Clear all data?',
    'This deletes every recording, appointment, and visit brief. Your profile and subscription stay. You can start fresh right after.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear everything',
        style: 'destructive',
        onPress: () => {
          useRecordingsStore.setState({ recordings: [] });
          useAppointmentsStore.setState({ appointments: [] });
          usePendingRecordingStore.getState().clear();
          useProfileStore.setState({ firstEntryHeroDismissed: false });
          hapticSuccess();
          Alert.alert('Cleared', 'Your record has been reset.');
        },
      },
    ],
  );
};

const openManageSubscription = () => {
  const url = Platform.OS === 'ios' ? IOS_SUBSCRIPTIONS_URL : ANDROID_SUBSCRIPTIONS_URL;
  Linking.openURL(url).catch(() => {
    Alert.alert(
      'Manage in store',
      `Open the ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'} → Subscriptions to manage Sympnote Plus.`,
    );
  });
};

const profileRows = (
  router: ReturnType<typeof useRouter>,
  personalization: PersonalizationProfile | null,
): SettingsRow[] => [
  {
    Icon: UserIcon,
    label: 'Age',
    value: personalization ? AGE_LABELS[personalization.ageBand] : 'Not set',
    onPress: () =>
      Alert.alert(
        'Age',
        'Sympnote uses your age band to calibrate AI reasoning. To change it, reset the app from the bottom of Settings.',
      ),
  },
  // Conditions row is rendered separately by ConditionsEditor — it
  // expands inline and edits the list without leaving Settings.
  {
    Icon: Users,
    label: 'Care team',
    value:
      personalization && personalization.careTeam.length > 0
        ? `${personalization.careTeam.length} ${personalization.careTeam.length === 1 ? 'clinician' : 'clinicians'}`
        : 'None added',
    onPress: () => router.push('/care-team'),
  },
  {
    Icon: Heart,
    label:
      personalization && personalization.focus.length > 1 ? 'Focus areas' : 'Focus area',
    value: personalization ? formatFocus(personalization.focus) : 'Not set',
    onPress: () => router.push('/onboarding/focus'),
  },
];

/**
 * Builds the grouped settings sections. Theme toggle and conditions
 * editor are NOT here — they're dedicated components rendered
 * directly in settings.tsx because they don't fit the simple
 * label/value/onPress row contract.
 */
export const useSettingsSections = (): SettingsSection[] => {
  const router = useRouter();
  const recordings = useRecordingsStore((s) => s.recordings);
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const personalization = useProfileStore((s) => s.personalization);
  const isEntitled =
    subscriptionStatus === 'trial' || subscriptionStatus === 'active';

  return [
    { title: 'Profile', rows: profileRows(router, personalization) },
    {
      title: 'Privacy & data',
      rows: [
        {
          Icon: Lock,
          label: 'Privacy',
          value: 'On-device transcription',
          onPress: () =>
            Alert.alert(
              'Privacy',
              'Voice is transcribed on-device. Only text you approve is sent to AI for structuring.',
            ),
        },
        {
          Icon: Download,
          label: `Export your data`,
          value: `${recordings.length} ${recordings.length === 1 ? 'recording' : 'recordings'} · JSON`,
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
        {
          Icon: Trash2,
          label: 'Clear all data',
          value: 'Recordings, appointments, briefs',
          tint: '#E07A5F',
          onPress: clearAllContent,
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
          badge: isEntitled ? 'PLUS' : undefined,
          onPress: () => {
            if (isEntitled) openManageSubscription();
            else router.push('/onboarding/paywall');
          },
        },
      ],
    },
  ];
};
