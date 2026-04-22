import React from 'react';
import Svg, { Circle as SvgCircle, Defs, RadialGradient, Stop } from 'react-native-svg';

export const OrbGradient: React.FC = () => (
  <Svg width="100%" height="100%" viewBox="0 0 140 140">
    <Defs>
      <RadialGradient id="orbGrad" cx="0.3" cy="0.3" r="0.8">
        <Stop offset="0" stopColor="#A8C4C2" />
        <Stop offset="0.7" stopColor="#2C6E6B" />
        <Stop offset="1" stopColor="#1F504E" />
      </RadialGradient>
    </Defs>
    <SvgCircle cx={70} cy={70} r={70} fill="url(#orbGrad)" />
  </Svg>
);
