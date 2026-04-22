import React, { useMemo } from "react";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  Path,
  G,
  Circle,
} from "react-native-svg";
import { moderateScale } from "../../theme";

type Props = {
  size?: number;
  rounded?: boolean;
};

export function SympnoteMark({ size = moderateScale(64), rounded = true }: Props) {
  const id = useMemo(() => "sn-" + Math.random().toString(36).slice(2, 8), []);
  const radius = rounded ? 16 : 0;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3BA79F" />
          <Stop offset="0.55" stopColor="#2C6E6B" />
          <Stop offset="1" stopColor="#1F504E" />
        </LinearGradient>
        <RadialGradient
          id={`${id}-glow`}
          cx="35%"
          cy="28%"
          rx="60%"
          ry="60%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Gradient tile + top-left glassy highlight. */}
      <Rect x={0} y={0} width={64} height={64} rx={radius} fill={`url(#${id}-bg)`} />
      <Rect x={0} y={0} width={64} height={64} rx={radius} fill={`url(#${id}-glow)`} />

      {/* Speech bubble with down-left tail. */}
      <Path
        d="M18 20 Q18 14 24 14 H40 Q46 14 46 20 V34 Q46 40 40 40 H30 L24 46 V40 Q18 40 18 34 Z"
        fill="#F5F1EA"
        opacity={0.95}
      />

      {/* Waveform bars — x=24/28.5/33/37.5, heights 6/14/22/14. */}
      <G>
        <Rect x={24} y={26} width={2.5} height={6} rx={1.25} fill="#2C6E6B" />
        <Rect x={28.5} y={22} width={2.5} height={14} rx={1.25} fill="#2C6E6B" />
        <Rect x={33} y={18} width={2.5} height={22} rx={1.25} fill="#2C6E6B" />
        <Rect x={37.5} y={22} width={2.5} height={14} rx={1.25} fill="#2C6E6B" />
      </G>

      {/* Gold sparkle (circle + 4-point starburst) at (44,14). */}
      <G x={44} y={14}>
        <Circle r={6} fill="#F6C06A" />
        <Path
          d="M0 -3 L0.8 -0.8 L3 0 L0.8 0.8 L0 3 L-0.8 0.8 L-3 0 L-0.8 -0.8 Z"
          fill="#FFFFFF"
          opacity={0.9}
        />
      </G>
    </Svg>
  );
}
