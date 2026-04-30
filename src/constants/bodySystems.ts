import {
  CardiologyMascot,
  DermatologyMascot,
  GastroMascot,
  NeurologyMascot,
  ObGynMascot,
  OphthalmologyMascot,
  OrthopedicsMascot,
  PsychiatryMascot,
} from '@/components/onboarding/care-team/SpecialtyMascots';

type MascotComponent = React.FC<{ size?: number }>;

interface BodySystemMatcher {
  /** Regex tested case-insensitively against the AI's free-text body
   *  system value. Patterns are intentionally fuzzy because the model
   *  picks its own phrasing ("musculoskeletal" / "joints" / "bone"). */
  match: RegExp;
  Mascot: MascotComponent;
}

/**
 * Body-system → mascot lookup. Reuses the existing specialty mascot
 * family so a recording's body system reads with the same visual
 * vocabulary as a clinician's specialty (heart on heart, brain on
 * brain). Body systems without a clear specialty equivalent
 * (respiratory, GI, urinary, endocrine, ENT, etc.) intentionally
 * return null — the body-system pill falls back to its plain
 * label-only treatment for those.
 */
const BODY_SYSTEM_MASCOTS: BodySystemMatcher[] = [
  { match: /cardio|heart|circulat|vascular/, Mascot: CardiologyMascot },
  { match: /neuro|brain|nerv|head|migrai/, Mascot: NeurologyMascot },
  { match: /ortho|musculo|joint|bone|muscle|skelet/, Mascot: OrthopedicsMascot },
  { match: /derm|skin|rash|integument/, Mascot: DermatologyMascot },
  { match: /eye|vision|ocular|ophthal/, Mascot: OphthalmologyMascot },
  { match: /reproduct|gyn|menstrua|uterin|ovari/, Mascot: ObGynMascot },
  { match: /psych|mental|mood|emot|anxiet|depress/, Mascot: PsychiatryMascot },
  { match: /gastro|gi\b|digest|stomach|bowel|intestin|abdom/, Mascot: GastroMascot },
];

export const findBodySystemMascot = (bodySystem: string): MascotComponent | null => {
  const v = bodySystem.trim().toLowerCase();
  if (!v) return null;
  return BODY_SYSTEM_MASCOTS.find(({ match }) => match.test(v))?.Mascot ?? null;
};
