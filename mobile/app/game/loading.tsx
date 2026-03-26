import { View, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useLevelLoader } from '~/hooks/useLevelLoader';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { FrigiLoader } from '~/components/ui/FrigiLoader';
import { frigi } from '~/utils/colors';

export default function GameLoadingScreen() {
  const params = useLocalSearchParams<{ mode?: string; levelId?: string }>();
  const mode = typeof params.mode === 'string' ? params.mode : null;
  const { levelId, isLoading, error } = useLevelLoader({
    mode,
    existingLevelId: typeof params.levelId === 'string' ? params.levelId : null,
  });

  useEffect(() => {
    if (levelId && !isLoading) {
      router.replace(`/game/${levelId}`);
    }
  }, [levelId, isLoading]);

  return (
    <SafeScreen>
      <View style={styles.container}>
        <FrigiLoader size={104} />
        <Text style={styles.text}>
          {error
            ? 'Falling back to offline level…'
            : mode === 'daily'
              ? 'Loading today’s daily fridge…'
              : 'Generating your level…'}
        </Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 16, color: frigi.textMuted },
});
