import { View, StyleSheet } from 'react-native';
import type { PlacedItem } from '@frigi/shared';

const CELL_SIZE = 48;

interface Props {
  item: PlacedItem;
}

export function PlacementGhost({ item }: Props) {
  return (
    <View style={styles.ghost}>
      {item.rotatedShape.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((cell, c) => (
            <View
              key={`${r}-${c}`}
              style={[
                styles.cell,
                cell === 1
                  ? { backgroundColor: item.color }
                  : styles.empty,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ghost: { opacity: 0.5 },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    margin: 1,
    borderRadius: 3,
  },
  empty: {
    backgroundColor: 'transparent',
  },
});
