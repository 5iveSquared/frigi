import { withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { SPRING_SNAP } from './springConfigs';

export function snapToPlace(shared: { value: number }, target: number) {
  'worklet';
  shared.value = withSpring(target, SPRING_SNAP);
}

export function bounceOnPlace(scale: { value: number }) {
  'worklet';
  scale.value = withSequence(
    withTiming(1.1, { duration: 80 }),
    withSpring(1, SPRING_SNAP)
  );
}
