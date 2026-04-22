# Handoff: Sympnote — Voice-first health journal (React Native)

## Overview
Sympnote is a mobile app that helps people prepare for doctor visits by letting them voice-log symptoms, meds, and side effects between appointments. AI organizes each log into structured fields (symptom, duration, severity, trigger), then assembles a one-page "visit brief" before every appointment so the patient walks in prepared and the doctor gets a clean signal.

This handoff contains the full HTML prototype (7 onboarding screens + 4 main tabs + settings), ready to be ported into the React Native app.

---

## About the Design Files
The files in this bundle are **design references created in HTML/React (web)** — prototypes showing intended look and behavior, **not production code to copy directly.**

The task is to **recreate these designs in the existing React Native codebase**, using its established patterns, navigation library (React Navigation / Expo Router), and component conventions. All HTML/CSS/SVG must be translated to:
- `View`, `Text`, `Pressable`, `ScrollView`, `Animated` (or Reanimated) primitives
- React Native StyleSheet or your existing styling system (NativeWind, Tamagui, Restyle, etc.)
- Native SVG via `react-native-svg` for the icons/logo
- Platform-appropriate haptics, status bar, safe-area handling

If the app uses NativeWind/Tailwind-RN, the Tailwind classes in the prototype port over with minimal changes.

---

## Fidelity
**High-fidelity (hifi).** Colors, typography scale, spacing, radii, shadows, and micro-interactions are all final. Recreate pixel-for-pixel using the codebase's existing styling system.

If the existing app already has a design system with different tokens, *match the visual intent* (teal-forward, warm cream background, generous spacing, rounded 16–24px cards) using those tokens — don't introduce a parallel system.

---

## Design Tokens

### Colors
| Name | Hex | Usage |
|---|---|---|
| `accent` | `#2C6E6B` | Primary teal — CTAs, active states, emphasis |
| `accent-dark` | `#1F504E` | Gradient endpoint, pressed states |
| `accent-light` | `#A8C4C2` | Subtle teal tints, focus rings |
| `accent-bright` | `#3BA79F` | Gradient start, highlights |
| `bg-primary` | `#F5F1EA` | App background (warm cream) |
| `bg-surface` | `#FFFFFF` | Cards, sheets |
| `bg-muted` | `#EBE5DA` | Chip backgrounds, secondary surfaces |
| `border-soft` | `#E0D9CC` | All card/input borders |
| `text-primary` | `#1A1F1E` | Body copy, headings |
| `text-secondary` | `#5A6361` | Supporting copy |
| `text-tertiary` | `#8A9290` | Labels, captions, metadata |
| `success` | `#5A8F6E` | Positive states, meds |
| `gold` | `#F6C06A` | Spark / highlight accent in logo + CTAs |
| `coral` | `#E07A5F` | Alerts, pattern warnings, symptoms |

### Typography — Inter (weights 400/500/600/700/800)
| Token | Size / Line-height / Weight / Tracking |
|---|---|
| `t-display` | 40 / 48 / 700 / -0.025em |
| `t-h1` | 28 / 34 / 700 / -0.02em |
| `t-h2` | 22 / 28 / 600 / -0.01em |
| `t-h3` | 18 / 24 / 600 |
| `t-body-lg` | 17 / 24 / 400 |
| `t-body` | 15 / 22 / 400 |
| `t-label` | 13 / 16 / 500 |
| `t-caption` | 11 / 14 / 400 |

### Spacing
4-based scale. Common values: 8, 12, 16 (default card padding), 20, 24, 32.

### Radii
- Chips / small buttons: 999 (pill)
- Inputs / secondary cards: 12
- Primary cards: 16–24
- Hero cards: 24
- Phone bezel inner: 40

### Shadows
```
shadow-soft     → 0 1px 2px rgba(26,31,30,0.04), 0 4px 12px rgba(26,31,30,0.05)
shadow-soft-lg  → 0 1px 2px rgba(26,31,30,0.04), 0 8px 24px rgba(26,31,30,0.08), 0 16px 40px rgba(26,31,30,0.06)
shadow-accent-glow → 0 8px 24px rgba(44,110,107,0.25), 0 2px 6px rgba(44,110,107,0.18)
```
In React Native, use `elevation` on Android (8 / 12 / 16) and `shadowColor/Offset/Opacity/Radius` on iOS.

### Gradients (used on hero surfaces)
- Primary CTA: `linear-gradient(135deg, #3BA79F 0%, #2C6E6B 55%, #1F504E 100%)` — use `react-native-linear-gradient` or Expo LinearGradient.
- Up-next card: `linear-gradient(135deg, #2C6E6B 0%, #1F504E 100%)`
- Logo tile: `linear-gradient(135deg, #3BA79F → #2C6E6B → #1F504E)` with gold spark `#F6C06A`.

---

## Navigation / Flow

```
Onboarding (stack):
  01 Hook → 02 Qualifier → 03 Focus area → 04 Care team
  → 05 Analyzing → 06 First recording → 07 Paywall
  → enter app

App (bottom tabs):
  [Home] [Prep] [Insights] [History]
  Avatar on Home → Settings (modal/push)
```

Onboarding is a one-time stack on fresh install; persist completion flag in secure storage (`AsyncStorage` or `MMKV`).

---

## Screens

### 01 — Hook (`screens/01_hook.jsx`)
**Purpose:** First impression. Brand + single-sentence promise + "Get started" CTA.
**Layout:**
- Full-bleed cream background
- Sympnote logo mark (128px) centered upper-third with animated pulse rings
- `t-display` headline "Remember everything. Say anything."
- `t-body-lg` supporting copy
- Primary CTA bottom, pinned with safe-area padding
**Notes:** Pulse rings use two staggered scale+fade animations (1.8s, one offset by 0.9s). Use Reanimated `withRepeat` + `withTiming`.

### 02 — Qualifier (`screens/03_qualifier.jsx`) — chat format
**Purpose:** Calibrate the product to the user through conversation.
**Layout:**
- Top bar: back + segmented progress bar + step counter (`1/4`)
- **Live plan card** ("Your Sympnote plan") pinned below top bar — accumulates unlocked features as user answers
- Chat feed (ScrollView): assistant bubbles on left with avatar tile, user bubbles on right (teal gradient)
- Typing indicator (3 bouncing dots, 160ms stagger) before each new question
- Bottom **answer tray**: wraps chips for multi-choice; for date step shows a card + two buttons
**4 questions:**
1. "Do you see a doctor regularly?" — often / sometimes / rarely
2. "What's hardest about doctor visits?" — memory / clarity / time / notes
3. "How often do you forget something important?" — always / often / sometimes / rarely
4. "When's your next appointment?" — date picker OR "Not scheduled"
**Plan unlock map** — each `(question_id, value)` pair unlocks a plan item shown in the live card. See `PLAN_UNLOCKS` in the file for the full map — it must be keyed by `"questionId:value"` to avoid collisions.
**Interaction:**
- Select answer → 450ms delay (lets user see their bubble appear) → advance step
- After final question → 600ms delay → call `onNext`
- Back button on step 0 → `onBack`; otherwise → previous step

### 03 — Focus area (`screens/03b_focus.jsx`)
Pick primary condition/concern (chronic vs acute, specific systems). Seeds what symptoms the app pre-suggests.

### 04 — Care team (`screens/04b_careteam.jsx`)
Add one or more doctors with name + specialty. Can skip.

### 05 — Analyzing (`screens/04_analyzing.jsx`)
Interstitial showing AI personalizing the plan. Orbit rings, step-by-step checklist, confetti on completion.

### 06 — First recording (`screens/05_recording.jsx`)
Guided first voice log. Big mic button with wave bars that animate off audio amplitude. Structured summary card appears below after recording. Include `🔒 End-to-end encrypted` caption under the mic — this is where trust is earned, inline.

### 07 — Paywall (`screens/06_paywall.jsx`)
Single plan focus. Trial terms. Skip/close option.

### 08 — Home tab (`screens/07_home.jsx`) ⭐ daily surface
**Layout top-to-bottom:**
- Header: greeting + date + avatar button (opens Settings)
- **Up-next appointment card** (hero, teal gradient) — doctor name (`t-h1`), specialty, date/time, "in Nd" countdown, "Prep ready" pill with sparkle icon. Tapping → Prep tab.
- **Quick log row** — 3 equal-width cards (💊 Medication · 😣 Symptom · 🩹 Side effect) each taps to open a log flow
- **Today** section: card with internal timeline per entry — time column (HH:MM + AM/PM) → vertical line with dot → content (tags + icon + text). Mixes voice entries and med logs.
- **Insight nudge** — smaller card pointing to Insights ("Knee pain logged 6 days in a row")
- **Pinned FAB** — 68px teal orb with mic icon, 92px from bottom, double pulse ring, white outer ring. Triggers voice log flow.

### 09 — Prep tab (`screens/08_prep.jsx`)
Per-appointment one-page brief. Concerns list, timeline of relevant entries, suggested questions to ask, copy/share actions.

### 10 — Insights tab (`screens/10_insights.jsx`)
Pattern cards, trends over time, readable charts.

### 11 — History tab (`screens/09_history.jsx`)
Filterable list of all entries with search + filter pills.

### 12 — Settings (`screens/11_settings.jsx`)
Account, notifications, data export/delete, privacy. Reached via avatar tap on Home.

---

## Shared Primitives (`screens/shared.jsx`)

Reimplement these as React Native components:

### Icons (Lucide-style, stroke-based)
All icons ship as inline SVG strings. **Port them by installing `lucide-react-native`** — every icon used (ArrowLeft, ArrowRight, Check, Mic, Home, Clipboard, History, Star, Search, Calendar, Copy, Share, Sparkles (→ Sparkle), Flame, Trophy, Zap (→ Bolt), Heart, Lock, Plus, Gift, TrendingUp, TrendingDown, ChevronRight, ChevronDown, Settings, LineChart, Bell, User, Users, Download, Accessibility, LogOut, Filter, Pill, Info, Pencil (→ Edit), X) is a direct Lucide match.

### SympnoteMark (app logo)
64×64 SVG:
- Rounded-corner tile (r=16) with teal diagonal gradient + radial top-left highlight
- Cream speech-bubble with a small tail pointing down-left (path starts at 18,20)
- 4 waveform bars inside the bubble at x=24/28.5/33/37.5, heights 6/14/22/14 (center bar tallest), teal fill
- Gold circle (r=6) at top-right (44,14) with 4-point white starburst inside

Port to `react-native-svg`. Used in 32px (nav chrome) and 128px (hero with pulse rings) sizes. Preserve the hero variant's two staggered pulse rings.

### StatusBar (custom)
The prototype draws its own 9:41 + signal/wifi/battery. In RN, **remove this** — use React Native's native status bar and `SafeAreaView` from `react-native-safe-area-context`.

### PrimaryButton
56px height, pill radius, teal gradient background, white text `t-body-lg` weight 600, `shadow-accent-glow`. Use `LinearGradient` wrapped in `Pressable`.

### SecondaryButton
52px height, pill, `bg-muted` fill, `text-primary` weight 600.

### BackButton
40×40 circular, ArrowLeft icon, no fill; press state adds `bg-muted`.

### TagChip
Inline pill, `#{tag}` format. Background = tag color at 15% alpha; text = tag color. Sizes to `t-caption`.

### ProgressRing
SVG circle with animated `strokeDashoffset` for progress value (0–100). Use `react-native-svg` + Reanimated `useAnimatedProps`. Track color `#EBE5DA`, progress color `#2C6E6B` (configurable).

### Confetti
32 pieces, each given random `--dx/--dy/--rot` CSS vars and flying outward over 1400ms with cubic-bezier easing. In RN, implement with `Animated.View`s and `withSequence` per piece, or use a library like `react-native-confetti-cannon`.

### StreakPill / XPPill
Gold/teal pills used sparingly. Streak has flame icon + day count.

---

## Animations & Interactions

| Name | Duration / Easing | Where |
|---|---|---|
| `screen-in` | 320ms cubic-bezier(0.2, 0.8, 0.2, 1) | Every screen mount |
| `fade-up` | 520ms cubic-bezier(0.2, 0.8, 0.2, 1), translateY 12→0 | Staggered list items, card contents |
| `pulse-ring` | 1.8s ease-in-out, infinite, scale 1→1.35 + opacity 0.45→0 | Logo hero, record FAB |
| `orb-pulse` | 2.4s ease-in-out, infinite, scale 1→1.06 + expanding shadow ring | Recording orb |
| `wave-bar` | 0.9s ease-in-out, infinite, scaleY 0.3→1 | Recording wave bars (staggered) |
| `confetti-fly` | 1400ms cubic-bezier(0.2, 0.7, 0.3, 1), transform to random dx/dy/rotate | Celebration moments |
| `typing-dot` | 1.1s bounce loop, 160ms stagger per dot | Qualifier chat typing indicator |
| `press` | 120ms scale 1→0.98 | All interactive elements |

Use **Reanimated 3** for all of these. Avoid `Animated` legacy API for anything touching shared values.

### Haptics
Add `expo-haptics` (or `react-native-haptic-feedback`):
- Chip/button press → `Haptics.ImpactFeedbackStyle.Light`
- Primary CTA advance → `Medium`
- Confetti moment (plan complete, first recording saved) → `Success` notification
- Paywall purchase → `Success`

---

## State Management

Keep it small. Suggested slices (Zustand or Redux Toolkit, whatever the app uses):

```ts
onboarding: {
  completed: boolean
  answers: Record<string, { value: string; label: string }>
  focus: string[]
  careTeam: Array<{ name: string; specialty: string }>
  nextAppointment?: { date: ISODate; doctorId: string }
}

entries: {
  items: Array<Entry>            // voice, med, symptom, side-effect
  // Entry: { id, createdAt, kind, durationMs?, transcript?, fields?, tags[] }
}

appointments: {
  items: Array<Appointment>      // doctorId, specialty, date, brief?
}

user: {
  name: string
  avatarInitials: string
  settings: { remindersAt, shareWith, ... }
}
```

Persist `onboarding` + `entries` to `MMKV` or `AsyncStorage`. `entries.items` is the source of truth for Home/History/Insights/Prep.

---

## Data Model (minimum)

```ts
type Entry =
  | { id: string; kind: 'voice';  createdAt: number; transcript: string; durationMs: number; fields: { symptom?: string; duration?: string; severity?: number; trigger?: string }; tags: Tag[] }
  | { id: string; kind: 'med';    createdAt: number; medName: string; dose: string; tags: Tag[] }
  | { id: string; kind: 'symptom'; createdAt: number; note: string; severity?: number; tags: Tag[] }
  | { id: string; kind: 'side-effect'; createdAt: number; note: string; medId?: string; tags: Tag[] }

type Tag = { label: string; color: string }  // e.g. { label: 'knee', color: '#E07A5F' }

type Appointment = {
  id: string; doctorName: string; specialty: string; dateTime: ISODate;
  brief?: { concerns: string[]; timeline: EntryId[]; questions: string[] }
}
```

---

## Platform Considerations

- **Audio recording**: `expo-av` or `react-native-audio-recorder-player`. Stream amplitude to drive wave bar scale values.
- **Speech-to-text**: Start with on-device (`@react-native-voice/voice`) for privacy; fallback to server. Whatever pipeline the app uses.
- **Notifications**: `expo-notifications` for visit countdowns and reminder nudges.
- **Keyboard/Safe area**: `react-native-safe-area-context` + `KeyboardAvoidingView` on the recording screen and any text-entry flows.
- **Accessibility**:
  - All `Pressable`s get `accessibilityRole` and `accessibilityLabel`
  - Mic button label: "Start voice log"
  - Respect `Reduce Motion` — gate pulse/confetti animations behind `AccessibilityInfo.isReduceMotionEnabled()`
  - Minimum text size: 13pt; all tap targets ≥ 44×44.

---

## Files in this bundle

```
design_handoff_sympnote/
├── README.md                       ← this file
├── Sympnote.html                   ← root file, wires navigation between screens
└── screens/
    ├── shared.jsx                  ← icons, logo, tokens, buttons, ProgressRing, Confetti, StreakPill
    ├── tabbar.jsx                  ← bottom tab bar (Home/Prep/Insights/History)
    ├── 01_hook.jsx                 ← onboarding: welcome
    ├── 03_qualifier.jsx            ← onboarding: chat-style qualifier w/ live plan card
    ├── 03b_focus.jsx               ← onboarding: focus area
    ├── 04b_careteam.jsx            ← onboarding: care team
    ├── 04_analyzing.jsx            ← onboarding: analyzing interstitial
    ├── 05_recording.jsx            ← onboarding: first voice recording
    ├── 06_paywall.jsx              ← onboarding: paywall
    ├── 07_home.jsx                 ← app: Home tab
    ├── 08_prep.jsx                 ← app: Prep tab
    ├── 09_history.jsx              ← app: History tab
    ├── 10_insights.jsx             ← app: Insights tab
    └── 11_settings.jsx             ← app: Settings (modal from Home avatar)
```

## How to run the reference
Open `Sympnote.html` in a browser. Use the screen picker at the bottom to jump between screens. All state transitions happen in `Sympnote.html`'s `App` component — use that as the source of truth for navigation shape.

---

## Implementation order (suggested)

1. **Tokens + shared primitives** (shared.jsx → your component library): colors, typography, PrimaryButton, SecondaryButton, BackButton, TagChip, SympnoteMark, ProgressRing.
2. **Navigation skeleton**: onboarding stack + bottom tabs + Settings modal.
3. **Hook → Qualifier → Focus → Care Team** — wire onboarding state.
4. **Analyzing → First Recording → Paywall** — wire audio + transcription plumbing.
5. **Home tab** (daily surface) — needs at least mock entries + one mock appointment.
6. **Prep tab** — depends on entries + appointment data.
7. **History + Insights + Settings**.

Happy building.
