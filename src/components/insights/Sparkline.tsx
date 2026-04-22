import React from 'react';
import Svg, { Circle, Polyline } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  color: string;
}

const W = 80;
const H = 24;

export const Sparkline: React.FC<SparklineProps> = ({ data, color }) => {
  const max = Math.max(...data, 10);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = W;
  const lastY = H - ((data[data.length - 1]! - min) / range) * H;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </Svg>
  );
};
