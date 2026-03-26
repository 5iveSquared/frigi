import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { frigi } from '~/utils/colors';

const STEPS = [
  {
    title: '1. Pick a grocery',
    body: 'Tap or drag an item from the tray. Bigger pieces are worth more space, so place those first.',
  },
  {
    title: '2. Rotate before dropping',
    body: 'Use the rotate control in the tray to turn the selected item until it fits the gap you want.',
  },
  {
    title: '3. Match the fridge zones',
    body: 'Shelf items belong on the top shelf, frozen items at the bottom, and chilled items in cold rows.',
  },
  {
    title: '4. Finish with fewer moves',
    body: 'You can remove and replace items, but every move counts against the final score.',
  },
];

export default function HowToPlayScreen() {
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>How to Play</Text>
          <Text style={styles.subtitle}>
            Pack every grocery into the fridge, respect the temperature zones, and do it efficiently.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.backButtonText}>← Home</Text>
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Core Goal</Text>
          <Text style={styles.tipBody}>
            Clear the tray by fitting every item into the fridge. Each new level gets a little tighter than the last.
          </Text>
        </View>

        {STEPS.map((step) => (
          <View key={step.title} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepBody}>{step.body}</Text>
          </View>
        ))}

        <View style={styles.zoneCard}>
          <Text style={styles.zoneTitle}>Zone Guide</Text>
          <View style={styles.zoneRow}>
            <View style={[styles.zoneSwatch, { backgroundColor: '#FEF3C7' }]} />
            <Text style={styles.zoneText}>Shelf: butter, eggs, easy-reach items</Text>
          </View>
          <View style={styles.zoneRow}>
            <View style={[styles.zoneSwatch, { backgroundColor: '#F1F5F9' }]} />
            <Text style={styles.zoneText}>Standard: pantry-safe groceries</Text>
          </View>
          <View style={styles.zoneRow}>
            <View style={[styles.zoneSwatch, { backgroundColor: '#DBEAFE' }]} />
            <Text style={styles.zoneText}>Cold: milk, yogurt, berries, chilled food</Text>
          </View>
          <View style={styles.zoneRow}>
            <View style={[styles.zoneSwatch, { backgroundColor: '#EDE9FE' }]} />
            <Text style={styles.zoneText}>Frozen: peas and freezer items</Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: frigi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: frigi.text,
  },
  hero: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: frigi.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: frigi.textMuted,
  },
  tipCard: {
    backgroundColor: '#FFF1F4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD5DE',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: frigi.red,
  },
  tipBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: frigi.text,
  },
  stepCard: {
    backgroundColor: frigi.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: frigi.text,
  },
  stepBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: frigi.textMuted,
  },
  zoneCard: {
    backgroundColor: frigi.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 16,
    gap: 10,
  },
  zoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: frigi.text,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: frigi.border,
  },
  zoneText: {
    flex: 1,
    fontSize: 13,
    color: frigi.textMuted,
  },
});
