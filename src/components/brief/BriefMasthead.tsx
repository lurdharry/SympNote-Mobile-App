import React from "react";
import { Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { fontScale, makeStyles, useTheme } from "@/theme";
import type { Brief } from "@/stores/types";

interface BriefMastheadProps {
  brief: Brief;
}

/**
 * Editorial masthead at the top of a brief — eyebrow with the date
 * window, title in Fraunces italic, meta line with generation time
 * and source-note count. Pure presentation.
 */
export const BriefMasthead: React.FC<BriefMastheadProps> = ({ brief }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  const generatedDate = format(parseISO(brief.generatedAt), "MMM d, yyyy · h:mm a");
  const windowStart = format(parseISO(brief.windowStart), "MMM d");
  const windowEnd = format(parseISO(brief.windowEnd), "MMM d");
  const windowLabel =
    windowStart === windowEnd ? windowStart : `${windowStart} – ${windowEnd}`;

  return (
    <>
      <Text style={[styles.eyebrow, { color: colors.accent }]}>
        BRIEF · {windowLabel}
      </Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {brief.title ?? "Brief"}
      </Text>
      <View style={styles.metaLine}>
        <Text style={[styles.metaText, { color: colors.textTertiary }]}>
          Generated {generatedDate} · {brief.sourceRecordingIds.length} notes
        </Text>
      </View>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 1.4,
    marginTop: theme.spacing.s4,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontSize: fontScale(32),
    lineHeight: fontScale(38),
    letterSpacing: -0.6,
    marginTop: 4,
  },
  metaLine: {
    marginTop: theme.spacing.s2,
  },
  metaText: {
    fontFamily: "DMSans_500Medium",
    fontSize: fontScale(13),
    letterSpacing: 0.2,
  },
}));
