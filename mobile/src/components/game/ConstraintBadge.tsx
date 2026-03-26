import { View, Text, StyleSheet } from 'react-native';
import type { Constraint } from '@frigi/shared';
import { frigi } from '~/utils/colors';

interface Props {
  constraint: Constraint;
  satisfied: boolean;
}

export function ConstraintBadge({ constraint, satisfied }: Props) {
  return (
    <View style={[styles.badge, satisfied && styles.satisfied]}>
      <Text style={styles.text}>{constraint.description}</Text>
      <Text style={styles.points}>+{constraint.points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: frigi.border,
  },
  satisfied: { backgroundColor: '#E8FFF3', borderColor: frigi.mint },
  text: { fontSize: 12, color: frigi.text },
  points: { fontSize: 12, fontWeight: '700', color: frigi.mint },
});
