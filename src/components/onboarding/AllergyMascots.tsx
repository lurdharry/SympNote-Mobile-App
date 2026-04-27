import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

/**
 * Allergy-category mini-mascots. Each is a small SVG character with
 * a face — same paper-clinical family as PocketbookMascot and the
 * other home / paywall mascots: cream / teal-trim / gold-accent
 * palette, soft asymmetric shapes, friendly eyes.
 *
 * Designed for the onboarding `health-context` allergy row, but
 * portable to anywhere that needs a 60–80pt allergy illustration.
 *
 * All mascots accept an optional `size` prop (defaults ~64pt) and
 * render inside a square wrapper so callers can drop them into a
 * row without worrying about aspect ratio.
 */
interface MascotProps {
  size?: number;
}

const wrap = (size: number) => ({
  width: size,
  height: size,
  alignItems: "center" as const,
  justifyContent: "center" as const,
});

// ─── 1. NoneMascot — "all clear" shield with a quiet smile ─────────────

export const NoneMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="none-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="none-check" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#7DB68A" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
      </Defs>
      {/* Shield body — softer than a classic crest */}
      <Path
        d="M 40 8 C 60 8 62 18 62 28 V 48 C 62 64 52 72 40 76 C 28 72 18 64 18 48 V 28 C 18 18 20 8 40 8 Z"
        fill="url(#none-body)"
        stroke="#2C6E6B"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Cheek blush dots */}
      <Circle cx={28} cy={42} r={2.5} fill="#F5A3A3" opacity={0.6} />
      <Circle cx={52} cy={42} r={2.5} fill="#F5A3A3" opacity={0.6} />
      {/* Eyes */}
      <Circle cx={32} cy={36} r={2.6} fill="#1F504E" />
      <Circle cx={48} cy={36} r={2.6} fill="#1F504E" />
      {/* Quiet smile */}
      <Path
        d="M 33 50 Q 40 55 47 50"
        stroke="#1F504E"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Green check pip — corner stamp */}
      <Circle cx={64} cy={62} r={9} fill="url(#none-check)" stroke="#FFFFFF" strokeWidth={2} />
      <Path
        d="M 60 62 L 63 65 L 68 59"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ─── 2. DrugMascot — capsule pill character ────────────────────────────

export const DrugMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="pill-top" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4DB8B0" />
          <Stop offset="1" stopColor="#2C6E6B" />
        </SvgLinearGradient>
        <SvgLinearGradient id="pill-bot" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Pill body — slight tilt for personality */}
      <Path
        d="M 18 50 C 6 50 6 30 18 30 H 62 C 74 30 74 50 62 50 Z"
        fill="url(#pill-bot)"
        stroke="#2C6E6B"
        strokeWidth={2.4}
        strokeLinejoin="round"
        transform="rotate(-8 40 40)"
      />
      {/* Teal upper half */}
      <Path
        d="M 18 30 C 6 30 6 40 12 40 H 68 C 74 40 74 30 62 30 Z"
        fill="url(#pill-top)"
        stroke="#2C6E6B"
        strokeWidth={2.4}
        strokeLinejoin="round"
        transform="rotate(-8 40 40)"
      />
      {/* Highlight gleam on teal */}
      <Ellipse
        cx={28}
        cy={32}
        rx={5}
        ry={1.4}
        fill="#FFFFFF"
        opacity={0.55}
        transform="rotate(-8 40 40)"
      />
      {/* Eyes on the cream half */}
      <Circle cx={34} cy={47} r={2.5} fill="#1F504E" transform="rotate(-8 40 40)" />
      <Circle cx={52} cy={45} r={2.5} fill="#1F504E" transform="rotate(-8 40 40)" />
      {/* Tiny smile */}
      <Path
        d="M 38 53 Q 43 56 48 53"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        transform="rotate(-8 40 40)"
      />
      {/* Floating sparkle */}
      <Path
        d="M 70 18 L 72 23 L 77 25 L 72 27 L 70 32 L 68 27 L 63 25 L 68 23 Z"
        fill="#F6C06A"
      />
    </Svg>
  </View>
);

// ─── 3. FoodMascot — apple with leaf hat ───────────────────────────────

export const FoodMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="apple-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F08C70" />
          <Stop offset="1" stopColor="#C45C3F" />
        </SvgLinearGradient>
        <SvgLinearGradient id="apple-leaf" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7DB68A" />
          <Stop offset="1" stopColor="#5A8F6E" />
        </SvgLinearGradient>
      </Defs>
      {/* Stem */}
      <Path
        d="M 40 18 C 40 12 42 10 44 10"
        stroke="#5A4A3A"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaf */}
      <Path
        d="M 44 10 Q 56 8 58 18 Q 50 20 44 14 Z"
        fill="url(#apple-leaf)"
        stroke="#3D6A4D"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {/* Apple body — slight asymmetry, dimple at top */}
      <Path
        d="M 40 18 C 22 18 16 32 16 48 C 16 64 26 74 40 74 C 54 74 64 64 64 48 C 64 32 58 18 40 18 Z"
        fill="url(#apple-body)"
        stroke="#8A3F2A"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Cheek blush */}
      <Circle cx={26} cy={50} r={4} fill="#F5A3A3" opacity={0.55} />
      <Circle cx={54} cy={50} r={4} fill="#F5A3A3" opacity={0.55} />
      {/* Eyes — cream on dark body */}
      <Circle cx={32} cy={42} r={3} fill="#FFFFFF" />
      <Circle cx={48} cy={42} r={3} fill="#FFFFFF" />
      <Circle cx={32} cy={42} r={1.4} fill="#1F504E" />
      <Circle cx={48} cy={42} r={1.4} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 33 56 Q 40 62 47 56"
        stroke="#FFFFFF"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Body highlight */}
      <Ellipse cx={28} cy={32} rx={6} ry={3} fill="#FFFFFF" opacity={0.35} />
    </Svg>
  </View>
);

// ─── 4. PollenMascot — daisy with floating pollen ──────────────────────

export const PollenMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="petal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE9C2" />
        </SvgLinearGradient>
        <SvgLinearGradient id="disc" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F6C06A" />
          <Stop offset="1" stopColor="#D9964A" />
        </SvgLinearGradient>
      </Defs>
      {/* 6 petals around centre — slightly varied for organic feel */}
      <Ellipse cx={40} cy={18} rx={9} ry={13} fill="url(#petal)" stroke="#C9BFA5" strokeWidth={1.4} />
      <Ellipse cx={60} cy={28} rx={9} ry={13} fill="url(#petal)" stroke="#C9BFA5" strokeWidth={1.4} transform="rotate(60 60 28)" />
      <Ellipse cx={62} cy={52} rx={9} ry={13} fill="url(#petal)" stroke="#C9BFA5" strokeWidth={1.4} transform="rotate(120 62 52)" />
      <Ellipse cx={40} cy={62} rx={9} ry={13} fill="url(#petal)" stroke="#C9BFA5" strokeWidth={1.4} transform="rotate(180 40 62)" />
      <Ellipse cx={20} cy={52} rx={9} ry={13} fill="url(#petal)" stroke="#C9BFA5" strokeWidth={1.4} transform="rotate(240 20 52)" />
      <Ellipse cx={18} cy={28} rx={9} ry={13} fill="url(#petal)" stroke="#C9BFA5" strokeWidth={1.4} transform="rotate(300 18 28)" />
      {/* Centre disc */}
      <Circle cx={40} cy={40} r={14} fill="url(#disc)" stroke="#A86F2A" strokeWidth={1.8} />
      {/* Eyes in the centre */}
      <Circle cx={36} cy={38} r={2.2} fill="#1F504E" />
      <Circle cx={44} cy={38} r={2.2} fill="#1F504E" />
      {/* Smile */}
      <Path
        d="M 36 44 Q 40 47 44 44"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Floating pollen specks */}
      <Circle cx={70} cy={14} r={2} fill="#F6C06A" opacity={0.85} />
      <Circle cx={74} cy={22} r={1.4} fill="#F6C06A" opacity={0.7} />
      <Circle cx={66} cy={10} r={1.2} fill="#F6C06A" opacity={0.6} />
    </Svg>
  </View>
);

// ─── 5. LatexMascot — friendly rubber glove ────────────────────────────

export const LatexMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="glove-body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
        <SvgLinearGradient id="glove-cuff" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3BA79F" />
          <Stop offset="1" stopColor="#2C6E6B" />
        </SvgLinearGradient>
      </Defs>
      {/* Glove silhouette — palm with 4 fingers + thumb */}
      <Path
        d="
          M 22 70
          V 40
          C 22 36 26 36 26 40
          V 30
          C 26 25 32 25 32 30
          V 26
          C 32 20 38 20 38 26
          V 30
          C 38 25 44 25 44 30
          V 30
          C 44 25 50 26 50 32
          V 36
          C 50 38 52 38 53 36
          C 56 30 62 32 60 40
          L 56 60
          C 56 66 52 70 46 70
          Z
        "
        fill="url(#glove-body)"
        stroke="#2C6E6B"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {/* Cuff band */}
      <Rect x={20} y={64} width={42} height={10} rx={4} fill="url(#glove-cuff)" />
      {/* Cuff highlight */}
      <Path d="M 24 68 H 50" stroke="#FFFFFF" strokeWidth={1.4} opacity={0.4} strokeLinecap="round" />
      {/* Eyes on the palm */}
      <Circle cx={34} cy={48} r={2.6} fill="#1F504E" />
      <Circle cx={44} cy={48} r={2.6} fill="#1F504E" />
      {/* Cheek blush */}
      <Circle cx={30} cy={54} r={3} fill="#F5A3A3" opacity={0.5} />
      <Circle cx={48} cy={54} r={3} fill="#F5A3A3" opacity={0.5} />
      {/* Smile */}
      <Path
        d="M 35 56 Q 39 59 43 56"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Gold sparkle on finger tip */}
      <Path
        d="M 38 14 L 39.4 18.6 L 44 20 L 39.4 21.4 L 38 26 L 36.6 21.4 L 32 20 L 36.6 18.6 Z"
        fill="#F6C06A"
      />
    </Svg>
  </View>
);

// ─── 6. OtherMascot — three friendly bubbles ───────────────────────────

export const OtherMascot: React.FC<MascotProps> = ({ size = moderateScale(64) }) => (
  <View style={wrap(size)}>
    <Svg width="100%" height="100%" viewBox="0 0 80 80">
      <Defs>
        <SvgLinearGradient id="bub-top" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#E5DDC8" />
        </SvgLinearGradient>
      </Defs>
      {/* Bottom small bubble */}
      <Circle cx={26} cy={66} r={6} fill="#E5DDC8" stroke="#C9BFA5" strokeWidth={1.6} />
      {/* Middle bubble */}
      <Circle cx={36} cy={52} r={9} fill="#E5DDC8" stroke="#C9BFA5" strokeWidth={1.8} />
      {/* Top — the face */}
      <Circle cx={48} cy={32} r={20} fill="url(#bub-top)" stroke="#2C6E6B" strokeWidth={2.4} />
      {/* Cheek blush */}
      <Circle cx={40} cy={36} r={3} fill="#F5A3A3" opacity={0.55} />
      <Circle cx={56} cy={36} r={3} fill="#F5A3A3" opacity={0.55} />
      {/* Eyes — slight squint, curious */}
      <Path
        d="M 41 28 Q 44 27 47 29"
        stroke="#1F504E"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 53 28 Q 56 27 59 29"
        stroke="#1F504E"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      {/* Tiny smile */}
      <Path
        d="M 44 38 Q 50 42 56 38"
        stroke="#1F504E"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      {/* Gold question pip — top right */}
      <Circle cx={68} cy={18} r={7} fill="#F6C06A" stroke="#FFFFFF" strokeWidth={1.6} />
      <Path
        d="M 65.5 16 Q 65.5 13 68 13 Q 70.5 13 70.5 16 Q 70.5 18 68 18.5 V 19.5"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx={68} cy={22} r={1.1} fill="#FFFFFF" />
    </Svg>
  </View>
);
