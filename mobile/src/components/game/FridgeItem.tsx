import { View, StyleSheet } from 'react-native';
import type { Item } from '@frigi/shared';

const CELL = 18;  // mini cell size for tray display
const GAP  = 2;

interface Props {
  item: Item;
  opacity?: number;
  cellSize?: number;
}

export function FridgeItem({ item, opacity = 1, cellSize = CELL }: Props) {
  return (
    <View style={{ opacity, gap: GAP }}>
      {item.shape.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: GAP }}>
          {row.map((cell, c) => (
            <View
              key={`${r}-${c}`}
              style={[
                {
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 3,
                },
                cell === 1
                  ? {
                      backgroundColor: item.color,
                      shadowColor: item.color,
                      shadowOpacity: 0.5,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 3,
                    }
                  : { backgroundColor: 'transparent' },
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
