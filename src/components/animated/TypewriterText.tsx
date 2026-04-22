import React, { useEffect, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTypewriter } from '@/hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  /** ms per char */
  speed?: number;
  /** initial delay before typing starts */
  delay?: number;
  style?: StyleProp<TextStyle>;
  showCursor?: boolean;
  onDone?: () => void;
}

const CURSOR_BLINK_MS = 500;

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 0,
  style,
  showCursor = false,
  onDone,
}) => {
  const reduced = useReducedMotion();
  const shown = useTypewriter(text, {
    charMs: speed,
    delayMs: delay,
    enabled: !reduced,
    onDone,
  });
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    if (!showCursor) return;
    const id = setInterval(() => setCursorOn((c) => !c), CURSOR_BLINK_MS);
    return () => clearInterval(id);
  }, [showCursor]);

  return (
    <Text style={style}>
      {shown}
      {showCursor && shown.length < text.length ? (cursorOn ? '▍' : ' ') : ''}
    </Text>
  );
};
