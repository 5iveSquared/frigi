import { View, Text, StyleSheet } from 'react-native';
import { frigi } from '~/utils/colors';

interface Props {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 16,
  md: 22,
  lg: 28,
};

export function StarRating({ rating, max = 3, size = 'md' }: Props) {
  const stars = Array.from({ length: max }, (_, i) => i < rating);
  const fontSize = sizeMap[size];

  return (
    <View style={styles.row}>
      {stars.map((filled, idx) => (
        <Text
          key={`${idx}-${filled ? 'on' : 'off'}`}
          style={[
            styles.star,
            { fontSize },
            filled ? styles.starOn : styles.starOff,
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  star: {
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowRadius: 6,
  },
  starOn: { color: frigi.orange },
  starOff: { color: '#E5E7EB' },
});
