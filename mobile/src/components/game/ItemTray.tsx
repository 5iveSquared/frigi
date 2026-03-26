import { ScrollView, View, Text, StyleSheet, Pressable, PanResponder } from 'react-native';
import { useGameStore } from '~/store/gameStore';
import { frigi, polar } from '~/utils/colors';
import { rotateShape } from '~/engine/rotation';
import { getFoodEmoji } from '~/utils/foodEmoji';
import type { Item } from '@frigi/shared';

interface ItemTrayProps {
  isDragging?: boolean;
  onBeginDrag?: (item: Item, point: { x: number; y: number }) => void;
  onDragMove?: (point: { x: number; y: number }) => void;
  onEndDrag?: (item: Item, point: { x: number; y: number }) => void;
}

export function ItemTray({
  isDragging = false,
  onBeginDrag,
  onDragMove,
  onEndDrag,
}: ItemTrayProps) {
  const unplacedItems = useGameStore((s) => s.unplacedItems);
  const placedItems   = useGameStore((s) => s.placedItems);
  const activeItem    = useGameStore((s) => s.activeItem);
  const setActiveItem = useGameStore((s) => s.setActiveItem);
  const activeRotation = useGameStore((s) => s.activeRotation);
  const rotateActive   = useGameStore((s) => s.rotateActive);
  const level = useGameStore((s) => s.level);
  const isDaily = !!level?.isDaily;

  const placed = placedItems.length;
  const total  = unplacedItems.length + placed;

  return (
    <View style={[styles.tray, isDaily && styles.trayDaily]}>
      <View style={[styles.header, isDaily && styles.headerDaily]}>
        <Text style={[styles.headerLabel, isDaily && styles.headerLabelDaily]}>Groceries to Pack</Text>
        <Text style={styles.headerCount}>
          <Text style={[styles.countPlaced, isDaily && styles.countPlacedDaily]}>{placed}</Text>
          <Text style={[styles.countSep, isDaily && styles.countSepDaily]}> of </Text>
          <Text style={[styles.countTotal, isDaily && styles.countTotalDaily]}>{total}</Text>
          <Text style={[styles.countSep, isDaily && styles.countSepDaily]}> placed</Text>
        </Text>
      </View>

      {activeItem && (
        <View style={[styles.rotateBar, isDaily && styles.rotateBarDaily]}>
          <Text style={[styles.rotateLabel, isDaily && styles.rotateLabelDaily]}>Rotation</Text>
          <Pressable onPress={rotateActive} style={[styles.rotateButton, isDaily && styles.rotateButtonDaily]}>
            <Text style={styles.rotateText}>↻ {activeRotation}°</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        bounces
        scrollEnabled={!isDragging}
      >
        {unplacedItems.length === 0 && (
          <View style={styles.allPlaced}>
            <Text style={styles.allPlacedEmoji}>✅</Text>
            <Text style={styles.allPlacedText}>All packed!</Text>
          </View>
        )}

        {unplacedItems.map((item) => {
          const isActive = item.id === activeItem?.id;
          const emoji    = getFoodEmoji(item.name);

          const previewShape = isActive
            ? rotateShape(item.shape, activeRotation)
            : item.shape;
          const dragResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) =>
              Math.abs(gestureState.dy) > 8 &&
              Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
            onPanResponderGrant: (_, gestureState) => {
              onBeginDrag?.(item, { x: gestureState.moveX, y: gestureState.moveY });
            },
            onPanResponderMove: (_, gestureState) => {
              onDragMove?.({ x: gestureState.moveX, y: gestureState.moveY });
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: (_, gestureState) => {
              onEndDrag?.(item, { x: gestureState.moveX, y: gestureState.moveY });
            },
            onPanResponderTerminate: (_, gestureState) => {
              onEndDrag?.(item, { x: gestureState.moveX, y: gestureState.moveY });
            },
          });

          return (
            <View key={item.id} {...dragResponder.panHandlers}>
              <Pressable
                onPress={() => setActiveItem(isActive ? null : item)}
                disabled={isDragging}
                style={({ pressed }) => [
                  styles.card,
                  isActive && styles.cardActive,
                  isDaily && styles.cardDaily,
                  isDaily && isActive && styles.cardActiveDaily,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.badgeRow}>
                  <View style={styles.zoneBadge}>
                    <Text style={styles.zoneBadgeText}>
                      {item.zoneRequirement === 'cold'   ? '❄ Cold' :
                       item.zoneRequirement === 'frozen' ? '🧊 Frozen' :
                       item.zoneRequirement === 'shelf'  ? '📦 Shelf' : 'Any'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.foodEmoji}>{emoji}</Text>

                {/* Item name */}
                <Text
                  style={[styles.name, isActive && styles.nameActive, isDaily && styles.nameDaily, isDaily && isActive && styles.nameActiveDaily]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                <View style={styles.shapePreview}>
                  {previewShape.map((row, r) => (
                    <View key={r} style={styles.shapeRow}>
                      {row.map((cell, c) => (
                        <View
                          key={`${r}-${c}`}
                          style={[
                            styles.shapeDot,
                            cell === 1
                              ? { backgroundColor: item.color }
                              : { backgroundColor: 'transparent' },
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>

                {isActive && <View style={styles.activeRing} />}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: frigi.surface,
    borderTopWidth: 1,
    borderTopColor: frigi.border,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  trayDaily: {
    backgroundColor: polar.trayBg,
    borderTopColor: polar.trayBorder,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: frigi.border,
  },
  headerDaily: {
    borderBottomColor: polar.trayBorder,
  },
  rotateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: frigi.border,
    backgroundColor: '#FAFAFB',
  },
  rotateBarDaily: {
    borderBottomColor: polar.trayBorder,
    backgroundColor: '#081424',
  },
  rotateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: frigi.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rotateLabelDaily: {
    color: polar.textLabel,
  },
  rotateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: frigi.text,
  },
  rotateButtonDaily: {
    backgroundColor: polar.emeraldDim,
  },
  rotateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: frigi.textMuted,
  },
  headerLabelDaily: {
    color: polar.textLabel,
  },
  headerCount: { flexDirection: 'row' },
  countPlaced: { fontSize: 11, color: frigi.red, fontWeight: '700' },
  countPlacedDaily: { color: polar.emerald },
  countSep:    { fontSize: 11, color: frigi.textLight },
  countSepDaily: { color: polar.textSecondary },
  countTotal:  { fontSize: 11, color: frigi.textMuted, fontWeight: '600' },
  countTotalDaily: { color: polar.textPrimary },

  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    alignItems: 'flex-start',
  },

  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    width: 90,
    alignItems: 'center',
    paddingBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardDaily: {
    backgroundColor: polar.itemCardBg,
    borderColor: polar.itemCardBorder,
  },
  cardActive: {
    backgroundColor: '#FFF1F4',
    borderColor: frigi.red,
  },
  cardActiveDaily: {
    backgroundColor: polar.itemCardActive,
    borderColor: polar.itemCardActiveBorder,
  },
  cardPressed: { opacity: 0.7 },

  badgeRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 2,
  },

  foodEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },

  name: {
    fontSize: 10,
    fontWeight: '600',
    color: frigi.textMuted,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  nameDaily: {
    color: polar.textPrimary,
  },
  nameActive: {
    color: frigi.red,
  },
  nameActiveDaily: {
    color: polar.emerald,
  },

  // Tiny footprint shape
  shapePreview: {
    gap: 2,
    marginBottom: 6,
  },
  shapeRow: {
    flexDirection: 'row',
    gap: 2,
  },
  shapeDot: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
  },

  zoneBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: frigi.border,
  },
  zoneBadgeText: {
    fontSize: 8,
    color: frigi.textMuted,
    fontWeight: '600',
  },

  activeRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: frigi.red,
  },

  allPlaced: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 4,
  },
  allPlacedEmoji: { fontSize: 28 },
  allPlacedText: { fontSize: 13, color: frigi.red, fontWeight: '600' },
});
