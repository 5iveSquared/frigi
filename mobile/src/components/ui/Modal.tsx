import { View, StyleSheet, Modal as RNModal, Pressable } from 'react-native';
import type { ReactNode } from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ visible, onClose, children }: Props) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>{children}</View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
});
