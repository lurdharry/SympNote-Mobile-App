import React from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { moderateScale } from "@/theme";

interface FirstEntryMiniProps {
  size?: number;
}

/**
 * Tiny notebook mascot for the FirstEntryHero card. Cream chart body
 * with teal binder rivets on the spine, two tiny eyes peeking from
 * the upper face, two ruled lines below to suggest a written page,
 * and a gold sparkle in the corner marking "saved." Static — the
 * surrounding card already animates its entry.
 *
 * Same paper-clinical family as PocketbookMascot but cut down for
 * inline use inside a card, no idle animations.
 */
export const FirstEntryMini: React.FC<FirstEntryMiniProps> = ({
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
      <Defs>
        <SvgLinearGradient id="fem-body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F5F1EA" />
        </SvgLinearGradient>
      </Defs>
      {/* Notebook body */}
      <Path
        d="M 10 12 H 52 Q 56 12 56 16 V 52 Q 56 56 52 56 H 10 Q 6 56 6 52 V 16 Q 6 12 10 12 Z"
        fill="url(#fem-body)"
        stroke="#C9BFA5"
        strokeWidth={1.4}
      />
      {/* Binder spine — three rivets on the left */}
      <Circle cx={8} cy={22} r={1.6} fill="#2C6E6B" opacity={0.7} />
      <Circle cx={8} cy={34} r={1.6} fill="#2C6E6B" opacity={0.7} />
      <Circle cx={8} cy={46} r={1.6} fill="#2C6E6B" opacity={0.7} />
      {/* Two eyes peeking from upper face */}
      <Circle cx={24} cy={28} r={1.9} fill="#1F504E" />
      <Circle cx={36} cy={28} r={1.9} fill="#1F504E" />
      {/* Two ruled lines below — written-on look */}
      <Path
        d="M 16 40 H 48"
        stroke="#C9BFA5"
        strokeWidth={0.9}
        strokeLinecap="round"
      />
      <Path
        d="M 16 47 H 40"
        stroke="#C9BFA5"
        strokeWidth={0.9}
        strokeLinecap="round"
      />
      {/* Gold sparkle marking "saved" */}
      <Path
        d="M 52 6 L 53.4 10.6 L 58 12 L 53.4 13.4 L 52 18 L 50.6 13.4 L 46 12 L 50.6 10.6 Z"
        fill="#F6C06A"
      />
    </Svg>
  </View>
);
