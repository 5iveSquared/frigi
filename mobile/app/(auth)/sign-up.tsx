import { View, Text, StyleSheet } from 'react-native';
import { SafeScreen } from '~/components/layout/SafeScreen';

export default function SignUpScreen() {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700' },
});
