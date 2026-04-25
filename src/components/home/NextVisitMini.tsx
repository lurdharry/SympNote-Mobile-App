import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { moderateScale } from "@/theme";

interface NextVisitMiniProps {
  size?: number;
}

/**
 * Tiny calendar mascot for the UpNextCard. Cream body with a coral
 * top strip (clinical tape feel), two teal ring posts standing up,
 * two tiny eyes mid-face, and a gold date pip below — reads as
 * "appointment with a friendly face."
 *
 * Designed to pop against the UpNextCard's teal gradient: cream body
 * provides contrast, gold + coral give it warmth.
 */
export const NextVisitMini: React.FC<NextVisitMiniProps> = ({
  size = moderateScale(56),
}) => (
  <View
    style={{
      width: size,
      height: size,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Svg width="100%" height="100%" viewBox="0 0 60 60">
      {/* Ring posts standing up above the body */}
      <Rect x={16} y={4} width={3} height={10} rx={1.4} fill="#1F504E" />
      <Rect x={41} y={4} width={3} height={10} rx={1.4} fill="#1F504E" />
      {/* Calendar body */}
      <Rect
        x={6}
        y={10}
        width={48}
        height={46}
        rx={6}
        fill="#FFFFFF"
        stroke="#C9BFA5"
        strokeWidth={1.4}
      />
      {/* Coral top strip */}
      <Path
        d="M 6 16 Q 6 10 12 10 H 48 Q 54 10 54 16 V 22 H 6 Z"
        fill="#E07A5F"
      />
      {/* Two ring eyelets sitting on the strip */}
      <Circle cx={17.5} cy={16} r={1.6} fill="#FFFFFF" />
      <Circle cx={42.5} cy={16} r={1.6} fill="#FFFFFF" />
      {/* Eyes mid-face */}
      <Circle cx={22} cy={34} r={1.9} fill="#1F504E" />
      <Circle cx={38} cy={34} r={1.9} fill="#1F504E" />
      {/* Gold date pip below — the "appointment marker" */}
      <Circle cx={30} cy={46} r={5.5} fill="#F6C06A" />
      {/* A tiny check / tick on the pip to read "scheduled" */}
      <Path
        d="M 27.5 46 L 29.5 48 L 32.5 44.5"
        stroke="#1F504E"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  </View>
);
