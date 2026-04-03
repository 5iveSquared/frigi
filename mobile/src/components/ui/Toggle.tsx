import { Pressable, View, StyleSheet } from 'react-native';
import { frigi } from '~/utils/colors';

interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}

export function Toggle({ checked, disabled = false, onChange }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.pressable, disabled && styles.pressableDisabled]}
    >
      <View style={[styles.track, checked && styles.trackOn]}>
        <View style={[styles.thumb, checked && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { paddingVertical: 2 },
  pressableDisabled: { opacity: 0.45 },
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: frigi.mint,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});
