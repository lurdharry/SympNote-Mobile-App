import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { LogOut, X as XIcon } from 'lucide-react-native';
import {
  makeStyles,
  moderateScale,
  spacing,
  typography,
  useTheme,
  verticalScale,
} from '@/theme';
import { hapticLight, hapticSuccess } from '@/services/haptics';
import { useRecordingsStore } from '@/stores/useRecordingsStore';
import { useAppointmentsStore } from '@/stores/useAppointmentsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useSettingsStats } from '@/hooks/useSettingsStats';
import { useSettingsSections } from '@/hooks/useSettingsSections';
import { ProfileCard } from '@/components/settings/ProfileCard';
import { SectionGroup } from '@/components/settings/SectionGroup';
import { MilestonesCard } from '@/components/settings/MilestonesCard';

const ScreenSettings: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();

  const recordings = useRecordingsStore((s) => s.recordings);
  const [voiceOnly, setVoiceOnly] = useState(false);

  const { streak, xp, level, xpForNextLevel, levelProgress, badges } =
    useSettingsStats();

  const sections = useSettingsSections();

  const close = () => {
    hapticLight();
    router.back();
  };

  const signOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          useProfileStore.getState().resetOnboarding();
          useRecordingsStore.setState({ recordings: [] });
          useAppointmentsStore.setState({ appointments: [] });
          hapticSuccess();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Settings</Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.closeBtn, { backgroundColor: colors.bgMuted }]}
          >
            <XIcon size={18} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.s10 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSlot}>
            <ProfileCard recordingsCount={recordings.length} streak={streak} />
          </View>

          {sections.map((section) => (
            <SectionGroup
              key={section.title}
              title={section.title}
              rows={section.rows}
              voiceOnly={voiceOnly}
              setVoiceOnly={setVoiceOnly}
            />
          ))}

          <MilestonesCard
            level={level}
            xp={xp}
            xpForNextLevel={xpForNextLevel}
            levelProgress={levelProgress}
            badges={badges}
          />

          <View style={styles.signOutSlot}>
            <Pressable
              onPress={signOut}
              style={[
                styles.signOut,
                { backgroundColor: colors.bgSurface, borderColor: colors.border },
              ]}
            >
              <LogOut size={16} color={colors.coral} strokeWidth={2} />
              <Text
                style={[
                  typography.label,
                  { color: colors.coral, fontFamily: 'DMSans_600SemiBold' },
                ]}
              >
                Sign out
              </Text>
            </Pressable>
            <Text
              style={[
                typography.caption,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: spacing.s3,
                },
              ]}
            >
              Sympnote v{Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default ScreenSettings;

const useStyles = makeStyles((theme) => ({
  safe: { flex: 1 },
  header: {
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSlot: {
    paddingHorizontal: spacing.s6,
    paddingBottom: spacing.s4,
  },
  signOutSlot: {
    paddingHorizontal: spacing.s6,
  },
  signOut: {
    height: verticalScale(48),
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderWidth: StyleSheet.hairlineWidth,
  },
}));
