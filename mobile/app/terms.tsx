import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { frigi } from '~/utils/colors';

const SECTIONS = [
  {
    title: 'Use of the App',
    body:
      'Frigi is provided for puzzle gameplay and progression tracking. You may use the app for normal personal play and leaderboard participation.',
  },
  {
    title: 'Accounts and Progress',
    body:
      'You are responsible for activity tied to your current device or signed-in profile. Guest progress can be reset locally from Settings.',
  },
  {
    title: 'Leaderboards',
    body:
      'Leaderboard placement depends on saved score, time, efficiency, and move data from completed runs. Tampering or abuse may result in data being removed.',
  },
  {
    title: 'Service Changes',
    body:
      'Levels, scoring rules, and balance may change over time as the game is tuned. Continued use means you accept those gameplay changes.',
  },
];

export default function TermsScreen() {
  return (
    <SafeScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Terms of Use</Text>
          <Text style={styles.subtitle}>
            These terms describe the basic rules for using Frigi, saving progress, and participating in leaderboards.
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
