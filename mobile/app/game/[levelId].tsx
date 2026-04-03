import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FridgeGrid } from '~/components/game/FridgeGrid';
import { ItemTray } from '~/components/game/ItemTray';
import { ScoreHUD } from '~/components/game/ScoreHUD';
import { useGameStore } from '~/store/gameStore';
import { useScoreSubmit } from '~/hooks/useScoreSubmit';
import { frigi } from '~/utils/colors';
import { playSoundEffectAsync } from '~/utils/soundEffects';
import { useHaptics } from '~/utils/haptics';
import type { Item } from '@frigi/shared';
import { getFoodEmoji } from '~/utils/foodEmoji';
import {
  getCellFromScreenCoordinates,
  getFridgeMetrics,
  type GridFrame,
} from '~/components/game/fridgeLayout';

interface DragState {
  item: Item;
  x: number;
  y: number;
}

const DRAG_PREVIEW_WIDTH = 88;
const DRAG_PREVIEW_HEIGHT = 72;

function getDropHitPoint(point: { x: number; y: number }) {
  return {
    x: point.x,
    y: point.y - DRAG_PREVIEW_HEIGHT / 2,
  };
}

export default function GameScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const level = useGameStore((s) => s.level);
  const grid = useGameStore((s) => s.grid);
  const unplaced = useGameStore((s) => s.unplacedItems);
  const activeItem = useGameStore((s) => s.activeItem);
  const activeRotation = useGameStore((s) => s.activeRotation);
  const setActiveItem = useGameStore((s) => s.setActiveItem);
  const placeActiveItem = useGameStore((s) => s.placeActiveItem);
  const { submit }  = useScoreSubmit();
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [gridFrame, setGridFrame] = useState<GridFrame | null>(null);
  const haptics = useHaptics();

  if (!grid) return null;
  const isDaily = !!level?.isDaily;
  const fridgeMetrics = getFridgeMetrics(windowWidth, grid.cols);

  const allPlaced   = unplaced.length === 0;
  const dragTargetCell = useMemo(
    () => {
      if (!dragState) return null;
      const hitPoint = getDropHitPoint(dragState);
      return getCellFromScreenCoordinates(
        hitPoint.x,
        hitPoint.y,
        gridFrame,
        grid.rows,
        grid.cols,
        fridgeMetrics
      );
    },
    [dragState, gridFrame, grid.rows, grid.cols, fridgeMetrics]
  );

  const handleFinish = async () => {
    console.info('[frigi][complete] finish:tap', {
      unplacedItems: unplaced.length,
      hasGrid: !!grid,
    });
    haptics.success();
    void playSoundEffectAsync('success');
    await submit();
    console.info('[frigi][complete] finish:navigate-results');
    router.replace('/game/results');
  };

  const handleBeginDrag = (item: Item, point: { x: number; y: number }) => {
    if (activeItem?.id !== item.id) {
      setActiveItem(item);
    }
    haptics.light();
    void playSoundEffectAsync('tap');
    setDragState({ item, x: point.x, y: point.y });
  };

  const handleDragMove = (point: { x: number; y: number }) => {
    setDragState((current) => (current ? { ...current, x: point.x, y: point.y } : current));
  };

  const handleEndDrag = (_item: Item, point: { x: number; y: number }) => {
    const hitPoint = getDropHitPoint(point);
    const targetCell =
      dragTargetCell ??
      getCellFromScreenCoordinates(
        hitPoint.x,
        hitPoint.y,
        gridFrame,
        grid.rows,
        grid.cols,
        fridgeMetrics
    );
    setDragState(null);
    if (targetCell) {
      const placed = placeActiveItem(targetCell.row, targetCell.col, activeRotation);
      if (placed) {
        haptics.medium();
        void playSoundEffectAsync('success');
      } else {
        haptics.error();
        void playSoundEffectAsync('error');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.screen, isDaily && styles.screenDaily]} edges={['top', 'bottom']}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={[styles.backBtn, isDaily && styles.backBtnDaily]}>
        <Text style={[styles.backIcon, isDaily && styles.backIconDaily]}>←</Text>
      </Pressable>

      {/* HUD */}
      <ScoreHUD />

      {/* Grid — flex fill */}
      <FridgeGrid dragTargetCell={dragTargetCell} onGridMeasure={setGridFrame} />

      {/* Finish button — appears when all items placed */}
      {allPlaced && (
        <View style={[styles.finishBar, isDaily && styles.finishBarDaily]}>
          <Pressable onPress={handleFinish} style={[styles.finishBtn, isDaily && styles.finishBtnDaily]}>
            <Text style={styles.finishText}>SUBMIT  →</Text>
          </Pressable>
        </View>
      )}

      {/* Item tray */}
      <ItemTray
        isDragging={!!dragState}
        onBeginDrag={handleBeginDrag}
        onDragMove={handleDragMove}
        onEndDrag={handleEndDrag}
      />

      {dragState && (
        <View pointerEvents="none" style={styles.dragOverlay}>
          <View
            style={[
              styles.dragCard,
              isDaily && styles.dragCardDaily,
              {
                left: dragState.x - DRAG_PREVIEW_WIDTH / 2,
                top: dragState.y - DRAG_PREVIEW_HEIGHT,
                borderColor: dragState.item.color,
              },
            ]}
          >
            <Text style={styles.dragEmoji}>{getFoodEmoji(dragState.item.name)}</Text>
            <Text style={[styles.dragName, isDaily && styles.dragNameDaily]} numberOfLines={1}>
              {dragState.item.name}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: frigi.bg,
  },
  screenDaily: {
    backgroundColor: '#060E1A',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: frigi.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: frigi.border,
  },
  backBtnDaily: {
    backgroundColor: '#10233E',
    borderColor: 'rgba(148,194,232,0.18)',
  },
  backIcon: {
    fontSize: 16,
    color: frigi.textMuted,
  },
  backIconDaily: {
    color: '#E2F4FF',
  },
  finishBar: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: frigi.surface,
    borderTopWidth: 1,
    borderTopColor: frigi.border,
  },
  finishBarDaily: {
    backgroundColor: '#07101E',
    borderTopColor: 'rgba(148,194,232,0.14)',
  },
  finishBtn: {
    backgroundColor: frigi.red,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishBtnDaily: {
    backgroundColor: '#10B981',
  },
  finishText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  dragCard: {
    position: 'absolute',
    width: DRAG_PREVIEW_WIDTH,
    minHeight: DRAG_PREVIEW_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dragCardDaily: {
    backgroundColor: 'rgba(16,35,62,0.98)',
    borderColor: '#10B981',
  },
  dragEmoji: {
    fontSize: 30,
    marginBottom: 4,
  },
  dragName: {
    fontSize: 11,
    fontWeight: '700',
    color: frigi.text,
    textAlign: 'center',
  },
  dragNameDaily: {
    color: '#E2F4FF',
  },
});
