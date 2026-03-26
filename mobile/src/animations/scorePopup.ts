import { withSpring, withTiming, withSequence } from 'react-native-reanimated';

export function animateScorePopup(
  opacity: { value: number },
  translateY: { value: number }
) {
  'worklet';
  opacity.value = 1;
  translateY.value = withSequence(
    withTiming(-40, { duration: 600 }),
    withTiming(-60, { duration: 200 })
  );
  opacity.value = withSequence(
    withTiming(1, { duration: 100 }),
    withTiming(0, { duration: 300 })
  );
}
