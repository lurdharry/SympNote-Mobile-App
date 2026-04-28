import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Router, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  ChevronRight,
  FileText,
  Mic,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  scale,
  shadows,
  typography,
  useTheme,
  verticalScale,
} from "@/theme";
import { hapticLight } from "@/services/haptics";
import { useReadyState, type ReadyState } from "@/hooks/useReadyState";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface Slot {
  eyebrow: string;
  headline: string;
  sub: string;
  ctaLabel: string;
  Icon: LucideIcon;
  onPress: (router: Router) => void;
}

const daysLabel = (n: number): string => {
  if (n <= 0) return "today";
  if (n === 1) return "tomorrow";
  if (n === 7) return "in a week";
  return `in ${n} days`;
};

const visitTitle = (specialty: string | undefined): string => {
  if (!specialty) return "Your visit";
  return specialty.charAt(0).toUpperCase() + specialty.slice(1);
};

/** State-driven slot builder. One declarative entry per state kind. */
const buildSlot = (state: ReadyState): Slot => {
  switch (state.kind) {
    case "day-zero":
      return {
        eyebrow: "GET STARTED",
        headline: "Capture your first note.",
        sub: "Hold the mic below to record. Sympnote turns it into a doctor-ready brief.",
        ctaLabel: "Start now",
        Icon: Mic,
        onPress: (router) => router.push("/record"),
      };

    case "visit-prep-brief": {
      const days = state.daysUntil ?? 0;
      const count = state.unbriefedCount ?? 0;
      return {
        eyebrow: `${visitTitle(state.visit?.specialty).toUpperCase()} · ${daysLabel(days).toUpperCase()}`,
        headline:
          count === 1
            ? "1 note ready to brief."
            : `${count} notes ready to brief.`,
        sub: "Synthesise them into a one-page brief tailored for this visit.",
        ctaLabel: "Generate brief",
        Icon: Sparkles,
        onPress: (router) => router.push("/brief/new"),
      };
    }

    case "visit-brief-ready":
      return {
        eyebrow: `${visitTitle(state.visit?.specialty).toUpperCase()} · ${daysLabel(state.daysUntil ?? 0).toUpperCase()}`,
        headline: "Your brief is ready.",
        sub: "Open it to review concerns, questions, and patterns before you go.",
        ctaLabel: "Open brief",
        Icon: FileText,
        onPress: (router) => {
          if (state.brief) router.push(`/brief/${state.brief.id}`);
        },
      };

    case "visit-no-notes":
      return {
        eyebrow: `${visitTitle(state.visit?.specialty).toUpperCase()} · ${daysLabel(state.daysUntil ?? 0).toUpperCase()}`,
        headline: "Anything you want to mention?",
        sub: "A short voice note now becomes a clinician-ready summary at the visit.",
        ctaLabel: "Capture a note",
        Icon: Mic,
        onPress: (router) => router.push("/record"),
      };

    case "compose-brief": {
      const count = state.unbriefedCount ?? 0;
      return {
        eyebrow: "READY TO BRIEF",
        headline:
          count === 1
            ? "1 note waiting to be synthesised."
            : `${count} notes waiting to be synthesised.`,
        sub: "Generate a brief now and it'll be ready for whichever clinician you tag it with.",
        ctaLabel: "Generate brief",
        Icon: Sparkles,
        onPress: (router) => router.push("/brief/new"),
      };
    }

    case "capture-today":
      return {
        eyebrow: "TODAY",
        headline: "How are you feeling today?",
        sub: "A quick check-in — even one sentence — keeps your brief sharp.",
        ctaLabel: "Capture",
        Icon: Mic,
        onPress: (router) => router.push("/record"),
      };

    case "rhythm-current":
    default:
      return {
        eyebrow: "ALL CAUGHT UP",
        headline: "You're current.",
        sub: "Add an upcoming visit and Sympnote will prep a brief when it's near.",
        ctaLabel: "Add a visit",
        Icon: TrendingUp,
        onPress: (router) => router.push("/appointment-new"),
      };
  }
};

/**
 * The home hero — one always-on card that picks the single most-
 * useful next action based on the user's state in the capture →
 * brief → visit loop. Copy and CTA shift between seven states; the
 * card chrome stays consistent so the hero anchors home reliably.
 *
 * Replaces the old stacked UpNextCard / BriefsPeek / TodayCheckIn
 * widgets — three weak conditional cards are now one strong card.
 */
export const ReadyStateCard: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const state = useReadyState();
  const slot = useMemo(() => buildSlot(state), [state]);

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        slot.onPress(router);
      }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.accent + "55" },
        shadows.card,
        { opacity: pressed ? 0.94 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={slot.headline}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[colors.accent + "16", colors.accent + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.eyebrowRow}>
        <View style={[styles.eyebrowIcon, { backgroundColor: colors.accent + "1F" }]}>
          <slot.Icon size={moderateScale(13)} color={colors.accent} strokeWidth={2.4} />
        </View>
        <Text style={[styles.eyebrowText, { color: colors.accent }]} numberOfLines={1}>
          {slot.eyebrow}
        </Text>
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]} numberOfLines={3}>
        {slot.headline}
      </Text>

      <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={2}>
        {slot.sub}
      </Text>

      <View style={styles.ctaRow}>
        <Text style={[styles.ctaLabel, { color: colors.accent }]}>{slot.ctaLabel}</Text>
        <ChevronRight size={moderateScale(16)} color={colors.accent} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    paddingHorizontal: moderateScale(18),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(16),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  eyebrowIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(7),
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrowText: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    flex: 1,
  },
  headline: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(24),
    lineHeight: fontScale(30),
    letterSpacing: -0.5,
    marginTop: theme.spacing.s3,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    marginTop: theme.spacing.s4,
    paddingTop: theme.spacing.s3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  ctaLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
    flex: 1,
  },
}));
