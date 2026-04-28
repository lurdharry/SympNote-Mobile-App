import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react-native";
import RNToast, {
  type BaseToastProps,
  type ToastConfig,
  type ToastConfigParams,
} from "react-native-toast-message";
import { fontScale, makeStyles, moderateScale, shadows, useTheme } from "@/theme";

/**
 * Brand-matched toast surface for react-native-toast-message. We
 * style three types — `error`, `success`, `info` — so call sites
 * stay terse (`showError("Couldn't generate")`) but the visual
 * language stays paper-clinical: cream surface, hairline border,
 * accent-tinted icon tile, optional one-tap action button.
 *
 * Designed for non-blocking API failures (AI generate, export, etc.)
 * where Alert.alert was previously interrupting the flow.
 */

interface CardProps {
  text1?: string;
  text2?: string;
  /** Optional CTA button on the right — typically "Retry". The host
   *  provides the handler via the `props` slot in `Toast.show()`. */
  actionLabel?: string;
  onAction?: () => void;
  variant: "error" | "success" | "info";
}

const ToastCard: React.FC<CardProps> = ({ text1, text2, actionLabel, onAction, variant }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const palette =
    variant === "error"
      ? { tint: colors.coral ?? "#E07A5F", Icon: AlertTriangle }
      : variant === "success"
        ? { tint: colors.success ?? "#5A8F6E", Icon: CheckCircle2 }
        : { tint: colors.accent, Icon: Info };
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgSurface,
          borderColor: palette.tint + "55",
        },
        shadows.card,
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: palette.tint + "1F" }]}>
        <palette.Icon size={moderateScale(16)} color={palette.tint} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {text1 ? (
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text
            style={[styles.body, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {text2}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            onAction();
            RNToast.hide();
          }}
          hitSlop={6}
          style={[styles.action, { borderColor: palette.tint }]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[styles.actionLabel, { color: palette.tint }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

type ToastProps = BaseToastProps & {
  text1?: string;
  text2?: string;
  props?: { actionLabel?: string; onAction?: () => void };
};

export const toastConfig: ToastConfig = {
  error: ({ text1, text2, props }: ToastConfigParams<ToastProps["props"]>) => (
    <ToastCard
      text1={text1}
      text2={text2}
      actionLabel={props?.actionLabel}
      onAction={props?.onAction}
      variant="error"
    />
  ),
  success: ({ text1, text2, props }: ToastConfigParams<ToastProps["props"]>) => (
    <ToastCard
      text1={text1}
      text2={text2}
      actionLabel={props?.actionLabel}
      onAction={props?.onAction}
      variant="success"
    />
  ),
  info: ({ text1, text2, props }: ToastConfigParams<ToastProps["props"]>) => (
    <ToastCard
      text1={text1}
      text2={text2}
      actionLabel={props?.actionLabel}
      onAction={props?.onAction}
      variant="info"
    />
  ),
};

interface ToastShowOptions {
  /** Optional supporting line beneath the title. */
  body?: string;
  /** Optional CTA on the right — typically "Retry". */
  actionLabel?: string;
  onAction?: () => void;
  /** Visibility duration in ms — defaults to 3500 for errors so the
   *  retry has time to be seen, 2400 for success/info. */
  visibilityTime?: number;
}

/** Imperative API. Call from anywhere (mutations, async handlers). */
export const showError = (title: string, opts?: ToastShowOptions): void => {
  RNToast.show({
    type: "error",
    text1: title,
    text2: opts?.body,
    visibilityTime: opts?.visibilityTime ?? 3500,
    props: { actionLabel: opts?.actionLabel, onAction: opts?.onAction },
  });
};

export const showSuccess = (title: string, opts?: ToastShowOptions): void => {
  RNToast.show({
    type: "success",
    text1: title,
    text2: opts?.body,
    visibilityTime: opts?.visibilityTime ?? 2400,
    props: { actionLabel: opts?.actionLabel, onAction: opts?.onAction },
  });
};

export const showInfo = (title: string, opts?: ToastShowOptions): void => {
  RNToast.show({
    type: "info",
    text1: title,
    text2: opts?.body,
    visibilityTime: opts?.visibilityTime ?? 2400,
    props: { actionLabel: opts?.actionLabel, onAction: opts?.onAction },
  });
};

export const hideToast = (): void => RNToast.hide();

/** Re-export for the host slot in the root layout. */
export { default as ToastHost } from "react-native-toast-message";

// ── Styles ────────────────────────────────────────────────────────

const useStyles = makeStyles((theme) => ({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    marginHorizontal: moderateScale(14),
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: "92%",
  },
  iconTile: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(14),
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: "DMSans_400Regular",
    fontSize: fontScale(12),
    lineHeight: fontScale(17),
    marginTop: 2,
  },
  action: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: 999,
    borderWidth: 1.2,
  },
  actionLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: fontScale(11),
    letterSpacing: 0.2,
  },
}));

