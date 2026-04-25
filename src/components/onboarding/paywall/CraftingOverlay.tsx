import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, typography, useTheme } from "../../../theme";
import { SympnoteSprite } from "../SympnoteSprite";

interface CraftingOverlayProps {
  reduced: boolean;
}

export const CraftingOverlay: React.FC<CraftingOverlayProps> = ({ reduced }) => {
  const { colors } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.body}>
          <SympnoteSprite pose="crafting" reduced={reduced} />
          <Text
            style={[
              typography.h2,
              {
                color: colors.textPrimary,
                textAlign: "center",
                marginTop: spacing.s6,
              },
            ]}
          >
            Crafting your summary…
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 8,
              },
            ]}
          >
            Turning your words into structured clinical fields.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.s6,
  },
});
