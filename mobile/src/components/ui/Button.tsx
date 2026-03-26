import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
    >
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
  primary: { backgroundColor: '#4CAF50' },
  secondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#4CAF50' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.4 },
  label: { fontSize: 16, fontWeight: '700', color: '#fff' },
  ghostLabel: { color: '#4CAF50' },
});
