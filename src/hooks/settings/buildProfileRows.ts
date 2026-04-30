import { useRouter } from "expo-router";
import { AgeMascot, CareTeamMascot } from "@/components/settings/SettingsMascots";
import { showInfo } from "@/components/ui/Toast";
import type { AgeBand, PersonalizationProfile } from "@/stores/types";
import type { SettingsRow } from "../useSettingsSections";

const AGE_LABELS: Record<AgeBand, string> = {
  teen: "12 to 17",
  "18-29": "18 to 29",
  "30-49": "30 to 49",
  "50-64": "50 to 64",
  "65-plus": "65 or older",
};

/**
 * Profile section rows — Age (read-only, requires reset to change)
 * and Care team. Conditions has its own component (ConditionsEditor)
 * rendered directly in settings.tsx; the focus row was dropped when
 * the onboarding focus screen was orphaned.
 */
export const buildProfileRows = (
  router: ReturnType<typeof useRouter>,
  personalization: PersonalizationProfile | null,
): SettingsRow[] => [
  {
    Mascot: AgeMascot,
    label: "Age",
    value: personalization ? AGE_LABELS[personalization.ageBand] : "Not set",
    onPress: () =>
      showInfo("Age", {
        body: "Sympnote uses your age band to calibrate AI reasoning. Reset the app from the bottom of Settings to change it.",
      }),
  },
  {
    Mascot: CareTeamMascot,
    label: "Care team",
    value:
      personalization && personalization.careTeam.length > 0
        ? `${personalization.careTeam.length} ${personalization.careTeam.length === 1 ? "clinician" : "clinicians"}`
        : "None added",
    onPress: () => router.push("/care-team"),
  },
];
