import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

interface Props {
  title: string;
  showBack?: boolean;
}

export function Header({ title, showBack }: Props) {
  return (
    <View style={styles.container}>
      {showBack && (
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { marginRight: 12, padding: 4 },
  backText: { fontSize: 20 },
  title: { fontSize: 18, fontWeight: '700' },
});
