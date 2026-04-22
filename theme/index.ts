import { useColorScheme } from "react-native";
import { lightColors, darkColors, ColorPalette } from "./colors";
import { useProfileStore } from "../stores/useProfileStore";

export * from "./colors";
export * from "./typography";
export * from "./spacing";
export * from "./radius";
export * from "./shadows";
export * from "./makeStyles";

export function useTheme(): { colors: ColorPalette; isDark: boolean } {
  const scheme = useColorScheme();
  const pref = useProfileStore((s) => s.themePreference);
  const effective = pref === "auto" ? scheme : pref;
  const isDark = effective === "dark";
  return { colors: isDark ? darkColors : lightColors, isDark };
}
