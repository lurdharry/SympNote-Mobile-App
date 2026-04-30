import React from "react";
import { Text, View } from "react-native";
import {
  fontScale,
  makeStyles,
  moderateScale,
  typography,
  useTheme,
} from "@/theme";
import { BriefMascot } from "./BriefMascot";

/**
 * Empty state on the Briefs tab — shown the first time before any
 * brief exists. Points the user at the header + button without
 * duplicating its action (the entire screen has one CTA path).
 */
export const BriefsEmpty: React.FC = () => {
  const { colors } = useTheme();
  const styles = useStyles();

  return (
    <View style={styles.empty}>
      <View style={styles.mascotSlot}>
        <BriefMascot size={moderateScale(120)} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>No briefs yet</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Synthesise your notes into something doctor-ready. Tap the + above to generate from your
        latest notes.
      </Text>
    </View>
  );
};

const useStyles = makeStyles((theme) => ({
  empty: {
    alignItems: "center",
    paddingTop: theme.spacing.s8,
    paddingHorizontal: theme.spacing.s6,
  },
  mascotSlot: {
    width: moderateScale(120),
    height: moderateScale(120),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.s3,
  },
  title: {
    fontFamily: "Fraunces_500Medium",
    fontStyle: "italic",
    fontSize: fontScale(22),
    lineHeight: fontScale(28),
  },
  sub: {
    ...typography.body,
    textAlign: "center",
    marginTop: theme.spacing.s2,
    fontSize: fontScale(13),
    lineHeight: fontScale(19),
    maxWidth: moderateScale(320),
  },
}));
