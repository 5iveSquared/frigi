import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useGameStore } from '~/store/gameStore';
import { checkPlacement, getValidPlacements } from '~/engine/placement';
import { getOccupiedCells, rotateShape } from '~/engine/rotation';
import type { PlacedItem } from '@frigi/shared';
import { frigi, frigiZones } from '~/utils/colors';
import { getFoodEmoji } from '~/utils/foodEmoji';
import { playSoundEffectAsync } from '~/utils/soundEffects';
import { useHaptics } from '~/utils/haptics';
import type { CellZone } from '@frigi/shared';
import {
  CELL_GAP,
  CELL_SIZE,
  DOOR_WIDTH,
  GRID_INNER_PAD,
  getFridgeMetrics,
  type GridCellTarget,
  type GridFrame,
} from './fridgeLayout';
import { getLevelEnvironment } from './levelEnvironment';

// Shelf bar shown between every row to simulate glass fridge shelves
function ShelfBar({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.shelf, { width, height }]}>
      <View style={[styles.shelfInner, { height: Math.max(4, height - 3) }]} />
    </View>
  );
}

interface FridgeGridProps {
  dragTargetCell?: GridCellTarget | null;
  onGridMeasure?: (frame: GridFrame) => void;
}

export function FridgeGrid({ dragTargetCell = null, onGridMeasure }: FridgeGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const grid        = useGameStore((s) => s.grid);
  const activeItem  = useGameStore((s) => s.activeItem);
  const activeRotation = useGameStore((s) => s.activeRotation);
  const placedItems = useGameStore((s) => s.placedItems);
  const placeActive = useGameStore((s) => s.placeActiveItem);
  const removePlaced = useGameStore((s) => s.removePlacedItem);
  const level = useGameStore((s) => s.level);
  const gridRef = useRef<View>(null);
  const environment = getLevelEnvironment(level);
  const haptics = useHaptics();
  const metrics = useMemo(
    () => getFridgeMetrics(windowWidth, grid?.cols ?? 4),
    [windowWidth, grid?.cols]
  );
  const gridWidth  = grid ? grid.cols * metrics.cellSize + (grid.cols - 1) * metrics.cellGap : 0;
  const innerPad   = metrics.gridInnerPad;
  const applianceWidth = gridWidth + innerPad * 2 + metrics.doorWidth;
  const sizeScale = metrics.scale;

  const measureGrid = useCallback(() => {
    if (!grid || !onGridMeasure) return;
    requestAnimationFrame(() => {
      gridRef.current?.measureInWindow((x, y, width, height) => {
        onGridMeasure({ x, y, width, height });
      });
    });
  }, [grid, onGridMeasure]);

  useEffect(() => {
    measureGrid();
  }, [measureGrid, gridWidth, grid?.rows, grid?.cols]);

  if (!grid) return null;

  // Build a fast itemId → item lookup
  const itemById = Object.fromEntries(placedItems.map((it) => [it.id, it]));
  const activePlaced: PlacedItem | null = activeItem
    ? {
        ...activeItem,
        anchorRow: 0,
        anchorCol: 0,
        rotation: activeRotation,
        rotatedShape: rotateShape(activeItem.shape, activeRotation),
      }
    : null;
  const placementPreview = useMemo(() => {
    if (!grid || !activePlaced) {
      return { anchorKeys: new Set<string>() };
    }

    const anchorKeys = new Set<string>();
    for (const placement of getValidPlacements(grid, activePlaced)) {
      anchorKeys.add(`${placement.row}-${placement.col}`);
    }

    return { anchorKeys };
  }, [grid, activePlaced]);
  const dragFootprintKeys = useMemo(() => {
    const footprintKeys = new Set<string>();
    if (!grid || !activePlaced || !dragTargetCell) return footprintKeys;
    const result = checkPlacement(grid, activePlaced, dragTargetCell.row, dragTargetCell.col);
    if (!result.valid) return footprintKeys;

    for (const [row, col] of getOccupiedCells(activePlaced.rotatedShape, dragTargetCell.row, dragTargetCell.col)) {
      footprintKeys.add(`${row}-${col}`);
    }
    return footprintKeys;
  }, [grid, activePlaced, dragTargetCell]);

  return (
    <View style={[styles.wrapper, { backgroundColor: environment.screenBg }]}>
      <View pointerEvents="none" style={[styles.environmentGlow, { backgroundColor: environment.glow }]} />

      {/* ── Appliance outer shell ── */}
      <View
        style={[
          styles.appliance,
          {
            width: applianceWidth,
            backgroundColor: environment.appliance,
            borderColor: environment.applianceBorder,
            shadowColor: environment.shadow,
          },
        ]}
      >

        {/* Top panel — fridge brand bar */}
        <View
          style={[
            styles.topPanel,
            {
              backgroundColor: environment.topPanel,
              borderBottomColor: environment.border,
              paddingHorizontal: 22 * sizeScale,
              paddingVertical: 12 * sizeScale,
            },
          ]}
        >
          <View style={[styles.handle, { width: 40 * sizeScale, height: Math.max(4, 6 * sizeScale), borderRadius: 3 * sizeScale, backgroundColor: environment.border }]} />
          <Text style={[styles.brand, { color: environment.text, fontSize: Math.max(13, 16 * sizeScale), letterSpacing: 4 * sizeScale }]}>FRIGI</Text>
          <Text style={[styles.brandSub, { color: environment.textMuted, fontSize: Math.max(6, 7 * sizeScale), letterSpacing: 1.5 * sizeScale }]}>
            {environment.name.toUpperCase()}
          </Text>
        </View>

        <View style={styles.bodyRow}>
          {/* Inner cavity */}
          <View style={[styles.cavity, { backgroundColor: environment.cavity, paddingHorizontal: innerPad, paddingVertical: innerPad }]}>
            {/* Interior back-light strip */}
            <View style={[styles.backlight, { width: gridWidth + innerPad, backgroundColor: environment.glow }]} />

            {/* Grid rows with shelf bars */}
            <View ref={gridRef} onLayout={measureGrid} style={{ width: gridWidth, gap: 0 }}>
              {grid.cells.map((row, r) => (
                <View key={r}>
                  {/* Shelf above each row except first */}
                  {r > 0 && <ShelfBar width={gridWidth} height={metrics.shelfHeight} />}

                  <View style={[styles.row, { gap: metrics.cellGap, paddingVertical: metrics.cellGap / 2 }]}>
                    {row.map((cell, c) => {
                      const cellKey = `${r}-${c}`;
                      const placedItem = cell.itemId ? itemById[cell.itemId] : null;
                      const emoji      = placedItem ? getFoodEmoji(placedItem.name) : null;
                      const isDragTarget =
                        dragTargetCell?.row === r && dragTargetCell?.col === c;
                      const isFootprintPreview =
                        !!activePlaced &&
                        !cell.occupied &&
                        dragFootprintKeys.has(cellKey);
                      const canTarget  =
                        !!activePlaced &&
                        !cell.occupied &&
                        placementPreview.anchorKeys.has(cellKey) &&
                        checkPlacement(grid, activePlaced, r, c).valid;

                      return (
                        <Pressable
                          key={`${r}-${c}`}
                          onPress={() => {
                            if (!canTarget) return;

                            const placed = placeActive(r, c, activeRotation);
                            if (placed) {
                              haptics.medium();
                              void playSoundEffectAsync('success');
                            }
                          }}
                          onLongPress={() => {
                            if (cell.occupied && cell.itemId) {
                              removePlaced(cell.itemId);
                              haptics.light();
                              void playSoundEffectAsync('tap');
                            }
                          }}
                          delayLongPress={250}
                          style={({ pressed }) => [
                            styles.cell,
                            {
                              width: metrics.cellSize,
                              height: metrics.cellSize,
                              borderRadius: Math.max(8, 8 * sizeScale),
                            },
                            { backgroundColor: cell.occupied
                                ? (placedItem ? placedItem.color + '33' : frigiZones[cell.zone])
                                : frigiZones[cell.zone] },
                            cell.blocked && styles.cellBlocked,
                            isFootprintPreview && styles.cellFootprintTarget,
                            canTarget  && styles.cellTarget,
                            isDragTarget && canTarget && styles.cellDragTarget,
                            pressed && canTarget && styles.cellPressed,
                            cell.occupied && !cell.blocked && { borderColor: placedItem?.color + '88' },
                          ]}
                        >
                          {cell.blocked ? (
                            <Text style={[styles.emoji, styles.blockedEmoji, { fontSize: Math.max(20, 26 * sizeScale) }]}>🥡</Text>
                          ) : cell.occupied && emoji ? (
                            <Text style={[styles.emoji, { fontSize: Math.max(22, 30 * sizeScale) }]}>{emoji}</Text>
                          ) : canTarget ? (
                            <Text style={[styles.dropHint, { fontSize: Math.max(16, 20 * sizeScale) }]}>+</Text>
                          ) : isFootprintPreview ? (
                            <View style={styles.footprintDot} />
                          ) : (
                            <ZoneIndicator zone={cell.zone} scale={sizeScale} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Door side */}
          <View style={[styles.door, {
            width: metrics.doorWidth,
            paddingHorizontal: 10 * sizeScale,
            paddingVertical: 12 * sizeScale,
            gap: 12 * sizeScale,
            backgroundColor: environment.door,
            borderLeftColor: environment.applianceBorder,
          }]}>
            <View style={styles.doorHeader}>
              <Text style={[styles.doorLabel, { color: environment.textMuted, fontSize: Math.max(7, 8 * sizeScale), letterSpacing: 1.4 * sizeScale }]}>Drinks</Text>
            </View>
            <View style={[styles.doorSlot, { borderColor: environment.border, backgroundColor: environment.surface, borderRadius: Math.max(10, 12 * sizeScale), paddingBottom: 6 * sizeScale, gap: 4 * sizeScale }]}>
              <View style={[styles.doorBottleTall, { width: 18 * sizeScale, height: 36 * sizeScale, borderRadius: 6 * sizeScale }]} />
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
            </View>
            <View style={[styles.doorSlot, { borderColor: environment.border, backgroundColor: environment.surface, borderRadius: Math.max(10, 12 * sizeScale), paddingBottom: 6 * sizeScale, gap: 4 * sizeScale }]}>
              <View style={[styles.doorBottleTall, { width: 18 * sizeScale, height: 36 * sizeScale, borderRadius: 6 * sizeScale }]} />
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
            </View>
            <View style={[styles.doorSlot, styles.doorSlotBottom, { borderColor: environment.border, backgroundColor: environment.surface, borderRadius: Math.max(10, 12 * sizeScale), paddingBottom: 6 * sizeScale, gap: 4 * sizeScale }]}>
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
            </View>
          </View>
        </View>

        {/* Bottom drawer / crisper bar */}
        <View style={[styles.drawerBar, { backgroundColor: environment.drawer, borderTopColor: environment.border, paddingVertical: 8 * sizeScale }]}>
          <Text style={[styles.drawerLabel, { color: environment.textMuted, fontSize: Math.max(7, 8 * sizeScale), letterSpacing: 2.5 * sizeScale }]}>
            CRISPER DRAWER
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendPill color={frigiZones.standard} label="Standard" environment={environment} />
        <LegendPill color={frigiZones.cold} label="Cold" environment={environment} />
        <LegendPill color={frigiZones.frozen} label="Frozen" environment={environment} />
        <LegendPill color={frigiZones.shelf} label="Shelf" environment={environment} />
      </View>

      {/* Instruction hint */}
      {activeItem && (
        <View style={[styles.hint, { backgroundColor: environment.accentSoft, borderColor: environment.accent }]}>
          <Text style={styles.hintEmoji}>{getFoodEmoji(activeItem.name)}</Text>
          <Text style={[styles.hintText, { color: environment.accent }]}>
            Tap a cell to place. Use the tray button to rotate.
          </Text>
        </View>
      )}
    </View>
  );
}

function ZoneIndicator({ zone, scale = 1 }: { zone: CellZone; scale?: number }) {
  if (zone === 'standard') return null;
  const icons: Record<string, string> = { cold: '❄', frozen: '🧊', shelf: '📦' };
  return <Text style={[styles.zoneHint, { fontSize: Math.max(12, 15 * scale) }]}>{icons[zone] ?? ''}</Text>;
}

function LegendPill({ color, label, environment }: { color: string; label: string; environment: ReturnType<typeof getLevelEnvironment> }) {
  return (
    <View style={[styles.legendItem, { backgroundColor: environment.surface, borderColor: environment.border }]}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: environment.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: frigi.bg,
    paddingVertical: 4,
    gap: 10,
  },
  environmentGlow: {
    position: 'absolute',
    width: '88%',
    height: '62%',
    borderRadius: 999,
    opacity: 0.7,
  },

  // ── Appliance chrome ──
  appliance: {
    maxWidth: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    shadowColor: frigi.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },

  topPanel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  handle: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: frigi.text,
    letterSpacing: 4,
  },
  brandSub: {
    fontSize: 7,
    fontWeight: '600',
    color: frigi.textLight,
    letterSpacing: 1.5,
  },

  bodyRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  cavity: {
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    position: 'relative',
  },

  // Subtle LED strip at top of interior
  backlight: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: 'rgba(148,163,184,0.35)',
    borderRadius: 2,
  },

  // ── Shelf ──
  shelf: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfInner: {
    width: '100%',
    height: 5,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.25)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.35)',
  },

  drawerBar: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  drawerLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: frigi.textLight,
    letterSpacing: 2.5,
  },

  // ── Grid cells ──
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: frigi.border,
  },
  cellTarget: {
    borderColor: frigi.red,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  cellFootprintTarget: {
    borderColor: 'rgba(255,77,106,0.38)',
    backgroundColor: 'rgba(255,77,106,0.08)',
  },
  cellDragTarget: {
    borderColor: frigi.red,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255,77,106,0.16)',
  },
  cellPressed: {
    backgroundColor: 'rgba(255,77,106,0.12)',
  },
  cellBlocked: {
    backgroundColor: 'rgba(71,85,105,0.28)',
    borderColor: 'rgba(71,85,105,0.45)',
  },
  blockedEmoji: {
    opacity: 0.75,
  },

  emoji: {
    fontSize: 30,
  },
  dropHint: {
    fontSize: 20,
    color: frigi.red,
    fontWeight: '300',
    opacity: 0.6,
  },
  footprintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,77,106,0.38)',
  },
  zoneHint: {
    fontSize: 15,
    opacity: 0.5,
  },

  // ── Door panel ──
  door: {
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 2,
    borderLeftColor: '#D1D5DB',
  },
  doorHeader: {
    alignItems: 'center',
  },
  doorLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: frigi.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  doorSlot: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    gap: 4,
  },
  doorSlotBottom: {
    flex: 0.7,
  },
  doorBottleTall: {
    width: 18,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
  },
  doorBottleShort: {
    width: 18,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FDE68A',
  },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 360,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: frigi.border,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
  },
  legendLabel: {
    fontSize: 11,
    color: frigi.textMuted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Instruction hint ──
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,77,106,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,77,106,0.25)',
  },
  hintEmoji: { fontSize: 18 },
  hintText: {
    fontSize: 13,
    color: frigi.red,
    fontWeight: '500',
  },
});
