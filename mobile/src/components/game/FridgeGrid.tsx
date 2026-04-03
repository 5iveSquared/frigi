import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useGameStore } from '~/store/gameStore';
import { checkPlacement, getValidPlacements } from '~/engine/placement';
import { getOccupiedCells, rotateShape } from '~/engine/rotation';
import type { PlacedItem } from '@frigi/shared';
import { frigi, frigiZones, polar } from '~/utils/colors';
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
  const isDaily = !!level?.isDaily;
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
      return { anchorKeys: new Set<string>(), footprintKeys: new Set<string>() };
    }

    const anchorKeys = new Set<string>();
    const footprintKeys = new Set<string>();
    for (const placement of getValidPlacements(grid, activePlaced)) {
      anchorKeys.add(`${placement.row}-${placement.col}`);
      for (const [row, col] of getOccupiedCells(activePlaced.rotatedShape, placement.row, placement.col)) {
        footprintKeys.add(`${row}-${col}`);
      }
    }

    return { anchorKeys, footprintKeys };
  }, [grid, activePlaced]);

  return (
    <View style={[styles.wrapper, isDaily && styles.wrapperDaily]}>

      {/* ── Appliance outer shell ── */}
      <View style={[styles.appliance, isDaily && styles.applianceDaily]}>

        {/* Top panel — fridge brand bar */}
        <View style={[styles.topPanel, isDaily && styles.topPanelDaily, { paddingHorizontal: 22 * sizeScale, paddingVertical: 12 * sizeScale }]}>
          <View style={[styles.handle, isDaily && styles.handleDaily, { width: 40 * sizeScale, height: Math.max(4, 6 * sizeScale), borderRadius: 3 * sizeScale }]} />
          <Text style={[styles.brand, isDaily && styles.brandDaily, { fontSize: Math.max(13, 16 * sizeScale), letterSpacing: 4 * sizeScale }]}>FRIGI</Text>
          <Text style={[styles.brandSub, isDaily && styles.brandSubDaily, { fontSize: Math.max(6, 7 * sizeScale), letterSpacing: 1.5 * sizeScale }]}>
            {isDaily ? 'DAILY DROP' : 'SMART COOLING'}
          </Text>
        </View>

        <View style={styles.bodyRow}>
          {/* Inner cavity */}
          <View style={[styles.cavity, isDaily && styles.cavityDaily, { paddingHorizontal: innerPad, paddingVertical: innerPad }]}>
            {/* Interior back-light strip */}
            <View style={[styles.backlight, isDaily && styles.backlightDaily, { width: gridWidth + innerPad }]} />

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
                        placementPreview.footprintKeys.has(cellKey);
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
                            isFootprintPreview && styles.cellFootprintTarget,
                            canTarget  && styles.cellTarget,
                            isDragTarget && canTarget && styles.cellDragTarget,
                            pressed && canTarget && styles.cellPressed,
                            cell.occupied && { borderColor: placedItem?.color + '88' },
                          ]}
                        >
                          {cell.occupied && emoji ? (
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
          }]}>
            <View style={styles.doorHeader}>
              <Text style={[styles.doorLabel, { fontSize: Math.max(7, 8 * sizeScale), letterSpacing: 1.4 * sizeScale }]}>Drinks</Text>
            </View>
            <View style={[styles.doorSlot, { borderRadius: Math.max(10, 12 * sizeScale), paddingBottom: 6 * sizeScale, gap: 4 * sizeScale }]}>
              <View style={[styles.doorBottleTall, { width: 18 * sizeScale, height: 36 * sizeScale, borderRadius: 6 * sizeScale }]} />
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
            </View>
            <View style={[styles.doorSlot, { borderRadius: Math.max(10, 12 * sizeScale), paddingBottom: 6 * sizeScale, gap: 4 * sizeScale }]}>
              <View style={[styles.doorBottleTall, { width: 18 * sizeScale, height: 36 * sizeScale, borderRadius: 6 * sizeScale }]} />
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
            </View>
            <View style={[styles.doorSlot, styles.doorSlotBottom, { borderRadius: Math.max(10, 12 * sizeScale), paddingBottom: 6 * sizeScale, gap: 4 * sizeScale }]}>
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
              <View style={[styles.doorBottleShort, { width: 18 * sizeScale, height: 24 * sizeScale, borderRadius: 6 * sizeScale }]} />
            </View>
          </View>
        </View>

        {/* Bottom drawer / crisper bar */}
        <View style={[styles.drawerBar, isDaily && styles.drawerBarDaily, { paddingVertical: 8 * sizeScale }]}>
          <Text style={[styles.drawerLabel, isDaily && styles.drawerLabelDaily, { fontSize: Math.max(7, 8 * sizeScale), letterSpacing: 2.5 * sizeScale }]}>
            {isDaily ? 'DAILY RESERVE' : 'CRISPER DRAWER'}
          </Text>
        </View>
      </View>

      <View style={[styles.legend, isDaily && styles.legendDaily]}>
        <LegendPill color={frigiZones.standard} label="Standard" daily={isDaily} />
        <LegendPill color={frigiZones.cold} label="Cold" daily={isDaily} />
        <LegendPill color={frigiZones.frozen} label="Frozen" daily={isDaily} />
        <LegendPill color={frigiZones.shelf} label="Shelf" daily={isDaily} />
      </View>

      {/* Instruction hint */}
      {activeItem && (
        <View style={[styles.hint, isDaily && styles.hintDaily]}>
          <Text style={styles.hintEmoji}>{getFoodEmoji(activeItem.name)}</Text>
          <Text style={[styles.hintText, isDaily && styles.hintTextDaily]}>
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

function LegendPill({ color, label, daily = false }: { color: string; label: string; daily?: boolean }) {
  return (
    <View style={[styles.legendItem, daily && styles.legendItemDaily]}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, daily && styles.legendLabelDaily]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: frigi.bg,
    paddingVertical: 8,
    gap: 12,
  },
  wrapperDaily: {
    backgroundColor: polar.depth,
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
  applianceDaily: {
    backgroundColor: '#0A1C31',
    borderColor: '#183353',
    shadowColor: '#020913',
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
  topPanelDaily: {
    backgroundColor: '#0E2440',
    borderBottomColor: '#183353',
  },
  handle: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  handleDaily: {
    backgroundColor: '#27476A',
  },
  brand: {
    fontSize: 16,
    fontWeight: '800',
    color: frigi.text,
    letterSpacing: 4,
  },
  brandDaily: {
    color: polar.textPrimary,
  },
  brandSub: {
    fontSize: 7,
    fontWeight: '600',
    color: frigi.textLight,
    letterSpacing: 1.5,
  },
  brandSubDaily: {
    color: polar.textSecondary,
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
  cavityDaily: {
    backgroundColor: '#10233E',
  },

  // Subtle LED strip at top of interior
  backlight: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: 'rgba(148,163,184,0.35)',
    borderRadius: 2,
  },
  backlightDaily: {
    backgroundColor: 'rgba(110,231,183,0.28)',
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
  drawerBarDaily: {
    backgroundColor: '#0E2440',
    borderTopColor: '#183353',
  },
  drawerLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: frigi.textLight,
    letterSpacing: 2.5,
  },
  drawerLabelDaily: {
    color: polar.textLabel,
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
  legendDaily: {
    opacity: 0.96,
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
  legendItemDaily: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(148,194,232,0.16)',
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
  legendLabelDaily: {
    color: polar.textPrimary,
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
  hintDaily: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.24)',
  },
  hintEmoji: { fontSize: 18 },
  hintText: {
    fontSize: 13,
    color: frigi.red,
    fontWeight: '500',
  },
  hintTextDaily: {
    color: polar.emerald,
  },
});
