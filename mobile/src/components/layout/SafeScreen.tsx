import { StyleSheet, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { frigi } from '~/utils/colors';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function SafeScreen({ children, style }: Props) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: frigi.bg },
});
