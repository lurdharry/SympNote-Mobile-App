import React, { useEffect, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = {
  text: string;
  speed?: number; // ms per char
  delay?: number;
  style?: StyleProp<TextStyle>;
  showCursor?: boolean;
  onDone?: () => void;
};

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  style,
  showCursor = false,
  onDone,
}: Props) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? text : '');
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    if (reduced) {
      setShown(text);
      onDone?.();
      return;
    }
    setShown('');
    let cancelled = false;
    let i = 0;
    const start = setTimeout(function step() {
      if (cancelled) return;
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        onDone?.();
        return;
      }
      setTimeout(step, speed);
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(start);
    };
  }, [text, speed, delay, reduced, onDone]);

  useEffect(() => {
    if (!showCursor) return;
    const id = setInterval(() => setCursorOn((c) => !c), 500);
    return () => clearInterval(id);
  }, [showCursor]);

  return (
    <Text style={style}>
      {shown}
      {showCursor && shown.length < text.length ? (cursorOn ? '▍' : ' ') : ''}
    </Text>
  );
}
