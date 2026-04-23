import { Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Accessibility,
  Activity,
  Bell,
  Download,
  Heart,
  Info,
  Lock,
  Mic,
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
  toggleKey?: 'voiceOnly';
  onPress?: () => void;
  /**
   * Optional override for the row's icon tile and icon tint. Used by
   * destructive rows (e.g. Clear all data) to signal consequence
   * without putting the whole row in red.
   */
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

const CONDITION_LABELS: Record<string, string> = {
  asthma: 'Asthma',
  diabetes: 'Diabetes',
  hypertension: 'Hypertension',
  depression: 'Depression/anxiety',
  migraines: 'Migraines',
  autoimmune: 'Autoimmune',
  thyroid: 'Thyroid',
  heart: 'Heart condition',
  'on-meds': 'On regular meds',
  smoker: 'Smoker',
};

const formatFocus = (focus: FocusArea[]): string => {
  if (focus.length === 0) return 'Not set';
  if (focus.length <= 2) return focus.map((f) => FOCUS_LABELS[f]).join(', ');
  return `${focus.length} areas`;
};

const formatConditions = (values: string[]): string => {
  if (values.length === 0) return 'None reported';
  if (values.length <= 2) return values.map((v) => CONDITION_LABELS[v] ?? v).join(', ');
  return `${values.length} conditions`;
};

const subscriptionLabel = (status: SubscriptionStatus): string => {
  if (status === 'trial') return 'Trial';
  if (status === 'active') return 'Active';
  return 'Not subscribed';
};

const openDeviceSettings = () => {
  Linking.openSettings().catch(() => {
    Alert.alert('Settings unavailable', 'Could not open device Settings.');
  });
};

/**
 * Wipe user content (recordings + appointments + their briefs + any
 * pending draft) while keeping session-level state: subscription,
 * personalization profile, onboardingComplete, theme and haptic
 * preferences. Intended as a content reset, NOT a sign-out.
 * Re-arms the first-entry hero so the next recording still gets the
 * one-time celebration.
 */
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
  const url =
    Platform.OS === 'ios' ? IOS_SUBSCRIPTIONS_URL : ANDROID_SUBSCRIPTIONS_URL;
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
        'Sympnote uses your age band to calibrate AI reasoning. To change it, redo onboarding from Settings → Sign out.',
      ),
  },
  {
    Icon: Activity,
    label:
      personalization && personalization.knownConditions.length > 1
        ? 'Known conditions'
        : 'Known condition',
    value: personalization ? formatConditions(personalization.knownConditions) : 'Not set',
    onPress: () =>
      Alert.alert(
        'Known conditions',
        'These inform the AI baseline when interpreting your entries. To change, redo onboarding from Settings → Sign out.',
      ),
  },
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
 * Builds the grouped settings sections. Each row declares its own
 * onPress so the screen just renders.
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
      title: 'Preferences',
      rows: [
        {
          Icon: Bell,
          label: 'Notifications',
          value: 'Managed by iOS',
          onPress: openDeviceSettings,
        },
        {
          Icon: Accessibility,
          label: 'Accessibility',
          value: 'Managed by iOS',
          onPress: openDeviceSettings,
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
          label: 'Privacy',
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
