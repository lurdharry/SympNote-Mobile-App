import { useMemo, useRef } from "react";
import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { isEqual } from "lodash";
import { useTheme } from "./useTheme";
import { ColorPalette } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { shadows } from "./shadows";

export type Theme = {
  colors: ColorPalette;
  isDark: boolean;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
};

type NamedStyles<T> = {
  [K in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/** Pin a value's reference across renders unless its deep shape changes. */
function useStable<P>(value: P): P {
  const ref = useRef(value);
  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

/**
 * Build a style hook bound to the current theme.
 *
 * ```ts
 * const useStyles = makeStyles((theme) => ({
 *   card: {
 *     borderRadius: theme.radius.md,
 *     padding: theme.spacing.s4,
 *     backgroundColor: theme.colors.bgSurface,
 *     ...theme.shadows.card,
 *   },
 *   title: {
 *     ...theme.typography.h1,
 *     color: theme.colors.textPrimary,
 *   },
 * }));
 *
 * // inside a component
 * const styles = useStyles();
 * ```
 *
 * The props-aware overload lets a single sheet adapt to instance data:
 *
 * ```ts
 * const useStyles = makeStyles((theme, p: { tint: string }) => ({
 *   pill: {
 *     backgroundColor: p.tint,
 *     borderRadius: theme.radius.full,
 *   },
 * }));
 *
 * const styles = useStyles({ tint: colors.accent });
 * ```
 *
 * The sheet is memoized on `(colors, isDark, props)` where `props` is
 * deep-compared — you can pass inline objects without triggering a
 * rebuild on every render.
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): () => T;
export function makeStyles<T extends NamedStyles<T>, P>(
  factory: (theme: Theme, props: P) => T,
): (props: P) => T;
export function makeStyles<T extends NamedStyles<T>, P = void>(
  factory: (theme: Theme, props: P) => T,
) {
  return function useStyles(props?: P): T {
    const { colors, isDark } = useTheme();
    const stableProps = useStable(props);
    return useMemo(() => {
      const theme: Theme = {
        colors,
        isDark,
        typography,
        spacing,
        radius,
        shadows,
      };
      return StyleSheet.create(factory(theme, stableProps as P));
    }, [colors, isDark, stableProps]);
  };
}
