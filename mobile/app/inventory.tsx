import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { frigi } from '~/utils/colors';

const CATEGORIES = ['All', 'Produce', 'Drinks', 'Dairy', 'Frozen'];

const ITEMS = [
  { id: 1, emoji: '🍎', name: 'Apple', category: 'Produce', shape: '1x1', unlocked: true, tone: '#FFE4E8' },
  { id: 2, emoji: '🥦', name: 'Broccoli', category: 'Produce', shape: '2x1', unlocked: true, tone: '#E8FFF4' },
  { id: 3, emoji: '🥛', name: 'Milk', category: 'Drinks', shape: '1x2', unlocked: true, tone: '#E6F2FF' },
  { id: 4, emoji: '🧀', name: 'Cheese', category: 'Dairy', shape: '1x1', unlocked: true, tone: '#FFF5DB' },
  { id: 5, emoji: '🧊', name: 'Ice Cubes', category: 'Frozen', shape: '2x2', unlocked: true, tone: '#E9F7FF' },
  { id: 6, emoji: '🥩', name: 'Steak', category: 'Produce', shape: '2x2', unlocked: false, tone: '#F3F4F6' },
  { id: 7, emoji: '🧃', name: 'Juice Box', category: 'Drinks', shape: '1x2', unlocked: false, tone: '#F3F4F6' },
  { id: 8, emoji: '🍕', name: 'Frozen Pizza', category: 'Frozen', shape: '3x1', unlocked: false, tone: '#F3F4F6' },
];

export default function InventoryScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const filteredItems =
    activeTab === 'All' ? ITEMS : ITEMS.filter((item) => item.category === activeTab);

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Groceries</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeTab;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveTab(cat)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={[styles.card, !item.unlocked && styles.cardLocked]}>
              <View style={[styles.cardEmojiWrap, { backgroundColor: item.tone }]}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                {!item.unlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockText}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <View style={styles.cardShape}>
                  <Text style={styles.cardShapeText}>{item.shape}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: frigi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 16, color: frigi.text },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  tabs: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: frigi.text,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: frigi.textMuted,
  },
  tabTextActive: {
    color: frigi.surface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    width: '47%',
    backgroundColor: frigi.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 12,
  },
  cardLocked: {
    opacity: 0.7,
  },
  cardEmojiWrap: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardEmoji: { fontSize: 28 },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: { fontSize: 16 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: frigi.text,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 11,
    color: frigi.textLight,
    fontWeight: '600',
  },
  cardShape: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardShapeText: {
    fontSize: 10,
    color: frigi.textMuted,
    fontWeight: '700',
  },
});
