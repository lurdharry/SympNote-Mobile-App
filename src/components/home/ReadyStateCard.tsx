import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Router, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight,
  FileText,
  Mic,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import { CheckInMascot } from "./CheckInMascot";
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
import { ReadyStateGlyph } from "./ReadyStateGlyph";

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
        Icon: CheckInMascot,
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
 * The home hero — one always-on card driven by the state-machine
 * picker in `useReadyState`. Anchors home with one bold typographic
 * moment and a single primary action.
 *
 * Visual anatomy:
 *   • Top accent stripe in brand teal so the page top reads as
 *     Sympnote at a glance, regardless of state.
 *   • Asymmetric layout — headline pulled to the left column,
 *     ReadyStateGlyph illustration tucked in the upper-right corner.
 *   • Filled accent CTA at the bottom — proper button, not a link.
 *
 * State variation comes from copy + icon + illustration, not color —
 * the brand stays disciplined to one accent.
 */
export const ReadyStateCard: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const state = useReadyState();
  const slot = useMemo(() => buildSlot(state), [state]);

  const tint = colors.accent;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: tint + "55" },
        shadows.card,
      ]}
    >
      {/* Top accent stripe — sets the mood by state */}
      <View style={[styles.stripe, { backgroundColor: tint }]} />

      {/* Soft accent wash — fades from top */}
      <LinearGradient
        pointerEvents="none"
        colors={[tint + "16", tint + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.wash}
      />

      <View style={styles.body}>
        <View style={styles.col}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowIcon, { backgroundColor: tint + "1F" }]}>
              <slot.Icon size={moderateScale(13)} color={tint} strokeWidth={2.4} />
            </View>
            <Text style={[styles.eyebrowText, { color: tint }]} numberOfLines={1}>
              {slot.eyebrow}
            </Text>
          </View>
          <Text style={[styles.headline, { color: colors.textPrimary }]} numberOfLines={3}>
            {slot.headline}
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={3}>
            {slot.sub}
          </Text>
        </View>
        <View style={styles.glyphSlot}>
          <ReadyStateGlyph Icon={slot.Icon} tint={tint} />
        </View>
      </View>

      {/* Filled accent CTA — actual button, not a link */}
      <Pressable
        onPress={() => {
          hapticLight();
          slot.onPress(router);
        }}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: tint, opacity: pressed ? 0.9 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={slot.ctaLabel}
      >
        <Text style={styles.ctaLabel}>{slot.ctaLabel}</Text>
        <ChevronRight size={moderateScale(16)} color="#FFFFFF" strokeWidth={2.6} />
      </Pressable>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  card: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(22),
    paddingBottom: moderateScale(16),
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateScale(5),
  },
  wash: {
    position: "absolute",
    top: moderateScale(5),
    left: 0,
    right: 0,
    height: verticalScale(140),
  },
  body: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(12),
  },
  col: {
    flex: 1,
    minWidth: 0,
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
    fontSize: fontScale(32),
    lineHeight: fontScale(38),
    letterSpacing: -0.8,
    marginTop: theme.spacing.s3,
  },
  sub: {
    ...typography.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    marginTop: theme.spacing.s2,
  },
  glyphSlot: {
    marginTop: -moderateScale(6),
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(4),
    height: verticalScale(48),
    borderRadius: 999,
    marginTop: theme.spacing.s4,
    paddingHorizontal: scale(14),
    ...shadows.accentGlow,
  },
  ctaLabel: {
    color: "#FFFFFF",
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(14),
    letterSpacing: 0.2,
  },
  // Keep referenced to avoid unused-style warnings during iteration.
  _stripeFiller: {
    width: 0,
    height: StyleSheet.hairlineWidth,
  },
}));
