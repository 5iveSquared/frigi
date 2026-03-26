import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { frigi } from '~/utils/colors';

const SECTIONS = [
  {
    title: 'What Frigi Stores',
    body:
      'Frigi stores the account details needed to identify your profile, your level progress, completed sessions, scores, and the generated levels linked to your runs.',
  },
  {
    title: 'How Gameplay Data Is Used',
    body:
      'Gameplay data is used to save your progress, rank leaderboard entries, and tune level difficulty so each new level gets harder at a controlled pace.',
  },
  {
    title: 'Guest Accounts',
    body:
      'If you play as a guest, Frigi creates a local guest identity and can sync progress tied to that guest profile until you reset it on this device.',
  },
  {
    title: 'Support Contact',
    body:
      'If you need help with your account or would like data removed, use the Contact Support option in Settings.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>
            This screen explains what Frigi keeps, why it keeps it, and how that data is used inside the app.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/settings')}>
            <Text style={styles.backButtonText}>← Settings</Text>
          </Pressable>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        ))}
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
  card: {
    backgroundColor: frigi.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: frigi.text,
  },
  cardBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: frigi.textMuted,
  },
});
