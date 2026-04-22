import * as Haptics from "expo-haptics";
import { useProfileStore } from "../stores/useProfileStore";

function enabled(): boolean {
  return useProfileStore.getState().hapticsEnabled;
}

export const hapticLight = () => {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const hapticMedium = () => {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

export const hapticHeavy = () => {
  if (!enabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
};

export const hapticSelect = () => {
  if (!enabled()) return;
  Haptics.selectionAsync().catch(() => {});
};

export const hapticSuccess = () => {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

export const hapticWarning = () => {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
};

export const hapticError = () => {
  if (!enabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
};
