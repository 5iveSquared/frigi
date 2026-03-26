import { useEffect, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { useSessionStore } from '~/store/sessionStore';

export function useGameTimer() {
  const elapsed = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      elapsed.value = getElapsedSeconds();
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { elapsed };
}
