import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { useTheme, radius, spacing, typography, shadows } from '../theme';
import { SceneTransition } from '../components/navigation/SceneTransition';
import { hapticLight, hapticSuccess } from '../services/haptics';
import {
  useProfileStore,
  ThemePreference,
  ReduceMotionPreference,
} from '../stores/useProfileStore';
import { useRecordingsStore } from '../stores/useRecordingsStore';
import { useAppointmentsStore } from '../stores/useAppointmentsStore';
import { formatDate } from '../utils/date';

export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();

  const goBack = () => {
    hapticLight();
    router.back();
  };

  return (
    <SceneTransition mode="sheet-up">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Pressable onPress={goBack} hitSlop={12}>
              <Text
                style={[
                  typography.label,
                  { color: colors.accent, letterSpacing: 0.3 },
                ]}
              >
                ← Done
              </Text>
            </Pressable>
          </View>

          <Text
            style={[
              typography.displaySerif,
              {
                color: colors.textPrimary,
                fontSize: 36,
                lineHeight: 42,
                marginBottom: spacing.s8,
              },
            ]}
          >
            Settings
          </Text>

          <SubscriptionSection />
          <PrivacyDataSection />
          <AppearanceSection />
          <MotionHapticsSection />
          <AboutSection />
          {__DEV__ && <DeveloperSection />}
        </ScrollView>
      </SafeAreaView>
    </SceneTransition>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.s8 }}>
      <View style={styles.sectionHeader}>
        <View
          style={[styles.rule, { backgroundColor: colors.accent }]}
        />
        <Text
          style={[
            typography.label,
            { color: colors.accent, letterSpacing: 0.3 },
          ]}
        >
          {title}
        </Text>
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.border,
            borderRadius: radius.lg,
          },
          shadows.card,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  description,
  right,
  onPress,
  destructive,
  isLast,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  isLast?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={{ flex: 1, paddingRight: spacing.s4 }}>
        <Text
          style={[
            typography.bodyLarge,
            {
              color: destructive ? colors.error : colors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={[
              typography.caption,
              { color: colors.textTertiary, marginTop: 4 },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: colors.bgMuted }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.segmentedWrap,
        { backgroundColor: colors.bgMuted, borderRadius: 999 },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              hapticLight();
              onChange(opt.value);
            }}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.bgSurface,
                ...shadows.card,
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                {
                  color: active ? colors.accent : colors.textSecondary,
                  letterSpacing: 0.3,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------ Sections ------------------------------ */

function SubscriptionSection() {
  const { colors } = useTheme();
  const status = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  const setSubscription = useProfileStore((s) => s.setSubscription);

  const statusLabel =
    status === 'trial'
      ? 'Trial'
      : status === 'active'
      ? 'Active'
      : status === 'expired'
      ? 'Expired'
      : 'Not subscribed';

  const statusTone =
    status === 'trial' || status === 'active'
      ? colors.success
      : status === 'expired'
      ? colors.warning
      : colors.textTertiary;

  const manage = () => {
    Alert.alert(
      'Manage subscription',
      Platform.OS === 'ios'
        ? 'Opening App Store subscriptions…'
        : 'Opening Play Store subscriptions…',
      [{ text: 'OK' }]
    );
    // TODO: Linking.openURL('itms-apps://apps.apple.com/account/subscriptions')
    // once RevenueCat wiring lands.
  };

  const restore = () => {
    hapticLight();
    Alert.alert('Restore purchases', 'No active purchases found.');
  };

  const cancelTrial = () => {
    Alert.alert(
      'Cancel trial?',
      'Your access will continue until the trial ends.',
      [
        { text: 'Keep trial', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            setSubscription('none', null);
            hapticSuccess();
          },
        },
      ]
    );
  };

  return (
    <Section title="Subscription">
      <Row
        label="Status"
        description={
          status === 'trial' && trialEndsAt
            ? `Trial ends ${formatDate(trialEndsAt)}`
            : undefined
        }
        right={
          <View
            style={[
              styles.statusPill,
              { borderColor: statusTone + '77' },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusTone }]}
            />
            <Text style={[typography.label, { color: statusTone, letterSpacing: 0.3 }]}>
              {statusLabel}
            </Text>
          </View>
        }
      />
      <Row label="Manage subscription" onPress={manage} />
      <Row
        label="Restore purchases"
        onPress={restore}
        isLast={status !== 'trial'}
      />
      {status === 'trial' && (
        <Row label="Cancel trial" destructive onPress={cancelTrial} isLast />
      )}
    </Section>
  );
}

function PrivacyDataSection() {
  const recordings = useRecordingsStore((s) => s.recordings);
  const appointments = useAppointmentsStore((s) => s.appointments);

  const exportData = async () => {
    hapticLight();
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        version: 1,
        recordings,
        appointments,
      };
      const json = JSON.stringify(payload, null, 2);
      const file = new File(Paths.cache, 'sympnote-export.json');
      if (file.exists) file.delete();
      file.create();
      file.write(json);
      const ok = await Sharing.isAvailableAsync();
      if (!ok) {
        Alert.alert(
          'Sharing unavailable',
          'File saved to cache but the system share sheet is not available on this device.'
        );
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Sympnote data',
      });
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  const deleteAll = () => {
    Alert.alert(
      'Delete all data?',
      'This will permanently remove every recording and appointment from this device. Your subscription status is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            // Resetting each store's array field avoids wiping the
            // persisted version/meta that Zustand middleware uses.
            useRecordingsStore.setState({ recordings: [] });
            useAppointmentsStore.setState({ appointments: [] });
            hapticSuccess();
            Alert.alert('Cleared', 'All recordings and appointments deleted.');
          },
        },
      ]
    );
  };

  return (
    <Section title="Privacy & data">
      <Row
        label="How your data is handled"
        description="Voice is transcribed on-device. Only transcript text you approve is sent to AI. Nothing is sold."
      />
      <Row
        label={`Export data (${recordings.length} entries)`}
        description="Share a JSON file with all your recordings + summaries."
        onPress={exportData}
      />
      <Row
        label="Delete all data"
        description="Removes every recording and appointment. Cannot be undone."
        destructive
        onPress={deleteAll}
        isLast
      />
    </Section>
  );
}

function AppearanceSection() {
  const pref = useProfileStore((s) => s.themePreference);
  const setPref = useProfileStore((s) => s.setThemePreference);
  return (
    <Section title="Appearance">
      <Row
        label="Theme"
        right={
          <SegmentedControl<ThemePreference>
            value={pref}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={setPref}
          />
        }
        isLast
      />
    </Section>
  );
}

function MotionHapticsSection() {
  const { colors } = useTheme();
  const haptics = useProfileStore((s) => s.hapticsEnabled);
  const setHaptics = useProfileStore((s) => s.setHapticsEnabled);
  const motion = useProfileStore((s) => s.reduceMotionOverride);
  const setMotion = useProfileStore((s) => s.setReduceMotionOverride);

  return (
    <Section title="Motion & feedback">
      <Row
        label="Haptics"
        description="Subtle vibration on taps and transitions."
        right={
          <Switch
            value={haptics}
            onValueChange={(v) => {
              setHaptics(v);
              if (v) hapticLight();
            }}
            trackColor={{ false: colors.bgMuted, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        }
      />
      <Row
        label="Reduce motion"
        description="Override your system preference."
        right={
          <SegmentedControl<ReduceMotionPreference>
            value={motion}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'on', label: 'On' },
              { value: 'off', label: 'Off' },
            ]}
            onChange={setMotion}
          />
        }
        isLast
      />
    </Section>
  );
}

function AboutSection() {
  const version =
    Constants.expoConfig?.version ?? '1.0.0';
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    String(Constants.expoConfig?.android?.versionCode ?? '');

  return (
    <Section title="About">
      <Row label="Version" right={<VersionText>{`${version}${build ? ` (${build})` : ''}`}</VersionText>} />
      <Row
        label="Support"
        description="mailto:support@sympnote.app"
        onPress={() => Linking.openURL('mailto:support@sympnote.app').catch(() => {})}
      />
      <Row
        label="Terms of Service"
        onPress={() => Linking.openURL('https://sympnote.app/terms').catch(() => {})}
      />
      <Row
        label="Privacy Policy"
        onPress={() => Linking.openURL('https://sympnote.app/privacy').catch(() => {})}
        isLast
      />
    </Section>
  );
}

function VersionText({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.body, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

function DeveloperSection() {
  const router = useRouter();
  const resetOnboarding = useProfileStore((s) => s.resetOnboarding);

  const doReset = () => {
    Alert.alert(
      'Reset onboarding?',
      'This will clear profile + preferences and send you back through the flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <Section title="Developer">
      <Row
        label="Reset onboarding"
        description="Wipe profile state and return to onboarding."
        destructive
        onPress={doReset}
        isLast
      />
    </Section>
  );
}

/* --------------------------------- styles --------------------------------- */

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    marginBottom: spacing.s3,
  },
  rule: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s4,
    minHeight: 56,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  segmentedWrap: {
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
