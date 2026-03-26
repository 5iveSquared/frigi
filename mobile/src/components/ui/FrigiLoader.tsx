import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { frigi } from '~/utils/colors';

interface Props {
  size?: number;
  label?: string;
}

export function FrigiLoader({ size = 92, label }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1900,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => {
      loop.stop();
      progress.stopAnimation();
      progress.setValue(0);
    };
  }, [progress]);

  const foodConfigs = useMemo(
    () => [
      { color: '#EF4444', y: size * 0.18, delay: 0 },
      { color: '#F59E0B', y: size * 0.42, delay: 0.22 },
      { color: '#10B981', y: size * 0.66, delay: 0.44 },
    ],
    [size]
  );

  const fridgeWidth = size * 0.46;
  const fridgeHeight = size * 0.86;
  const itemSize = Math.max(10, size * 0.12);
  const travelStart = -size * 0.22;
  const travelEnd = size * 0.3;

  return (
    <View style={styles.container}>
      <View style={[styles.stage, { width: size * 1.2, height: size }]}>
        <View
          style={[
            styles.fridge,
            {
              width: fridgeWidth,
              height: fridgeHeight,
              borderRadius: size * 0.11,
              right: size * 0.02,
              top: size * 0.06,
            },
          ]}
        >
          <View style={[styles.fridgeGlow, { borderRadius: size * 0.11 }]} />
          <View
            style={[
              styles.fridgeDoorLine,
              {
                left: fridgeWidth * 0.53,
                top: fridgeHeight * 0.1,
                bottom: fridgeHeight * 0.1,
              },
            ]}
          />
          <View
            style={[
              styles.fridgeHandle,
              {
                width: size * 0.03,
                height: fridgeHeight * 0.26,
                borderRadius: size * 0.02,
                right: fridgeWidth * 0.14,
                top: fridgeHeight * 0.3,
              },
            ]}
          />
          <View
            style={[
              styles.fridgeShelf,
              {
                left: fridgeWidth * 0.12,
                right: fridgeWidth * 0.18,
                top: fridgeHeight * 0.34,
              },
            ]}
          />
          <View
            style={[
              styles.fridgeShelf,
              {
                left: fridgeWidth * 0.12,
                right: fridgeWidth * 0.18,
                top: fridgeHeight * 0.6,
              },
            ]}
          />
        </View>

        {foodConfigs.map((food, index) => {
          const shifted = Animated.modulo(
            Animated.add(progress, new Animated.Value(food.delay)),
            1
          );
          const translateX = shifted.interpolate({
            inputRange: [0, 0.72, 1],
            outputRange: [travelStart, travelEnd, travelEnd + itemSize * 0.55],
          });
          const opacity = shifted.interpolate({
            inputRange: [0, 0.08, 0.68, 0.82, 1],
            outputRange: [0, 1, 1, 0.1, 0],
          });
          const scale = shifted.interpolate({
            inputRange: [0, 0.12, 0.72, 1],
            outputRange: [0.7, 1, 1, 0.72],
          });
          const rotate = shifted.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: ['-10deg', '0deg', '8deg'],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.food,
                {
                  width: itemSize,
                  height: itemSize,
                  borderRadius: index === 1 ? itemSize * 0.26 : itemSize / 2,
                  backgroundColor: food.color,
                  left: size * 0.12,
                  top: food.y,
                  opacity,
                  transform: [{ translateX }, { scale }, { rotate }],
                },
              ]}
            >
              {index === 0 ? <View style={styles.appleLeaf} /> : null}
              {index === 2 ? (
                <View style={styles.leafyWrap}>
                  <View style={styles.leafOne} />
                  <View style={styles.leafTwo} />
                </View>
              ) : null}
            </Animated.View>
          );
        })}
      </View>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  stage: {
    position: 'relative',
    justifyContent: 'center',
  },
  fridge: {
    position: 'absolute',
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#D4E5F9',
    overflow: 'hidden',
  },
  fridgeGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 197, 253, 0.12)',
  },
  fridgeDoorLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#D6E4F5',
  },
  fridgeHandle: {
    position: 'absolute',
    backgroundColor: '#B8CCE2',
  },
  fridgeShelf: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#DFEBF8',
  },
  food: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  appleLeaf: {
    position: 'absolute',
    width: 8,
    height: 5,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    top: -3,
    left: 4,
    transform: [{ rotate: '-28deg' }],
  },
  leafyWrap: {
    position: 'absolute',
    top: -4,
    left: 1,
    flexDirection: 'row',
    gap: 1,
  },
  leafOne: {
    width: 5,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    transform: [{ rotate: '-28deg' }],
  },
  leafTwo: {
    width: 5,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    transform: [{ rotate: '28deg' }],
  },
  label: {
    fontSize: 14,
    color: frigi.textMuted,
    textAlign: 'center',
  },
});
