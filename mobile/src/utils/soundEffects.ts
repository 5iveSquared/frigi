import {
  Audio,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  type AVPlaybackSource,
} from 'expo-av';
import { useSettingsStore } from '~/store/settingsStore';

const SOUND_SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  success: require('../../assets/sounds/success.wav'),
  error: require('../../assets/sounds/error.wav'),
} as const satisfies Record<string, AVPlaybackSource>;

export type SoundEffectName = keyof typeof SOUND_SOURCES;

let audioConfigured = false;
let soundLoadPromise: Promise<void> | null = null;
const loadedSounds: Partial<Record<SoundEffectName, Audio.Sound>> = {};

async function configureAudioAsync() {
  if (audioConfigured) return;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    playThroughEarpieceAndroid: false,
    playsInSilentModeIOS: false,
    shouldDuckAndroid: true,
    staysActiveInBackground: false,
  });
  audioConfigured = true;
}

async function ensureSoundsLoadedAsync() {
  if (soundLoadPromise) {
    return soundLoadPromise;
  }

  soundLoadPromise = (async () => {
    await configureAudioAsync();

    for (const effectName of Object.keys(SOUND_SOURCES) as SoundEffectName[]) {
      if (loadedSounds[effectName]) continue;
      const { sound } = await Audio.Sound.createAsync(SOUND_SOURCES[effectName], {
        shouldPlay: false,
        volume: effectName === 'success' ? 0.7 : 0.55,
      });
      loadedSounds[effectName] = sound;
    }
  })().catch((error) => {
    soundLoadPromise = null;
    throw error;
  });

  return soundLoadPromise;
}

export async function preloadSoundEffectsAsync() {
  try {
    await ensureSoundsLoadedAsync();
  } catch (error) {
    console.warn('Failed to preload sound effects', error);
  }
}

export async function playSoundEffectAsync(effectName: SoundEffectName) {
  if (!useSettingsStore.getState().soundEnabled) return;

  try {
    await ensureSoundsLoadedAsync();
    await loadedSounds[effectName]?.replayAsync();
  } catch (error) {
    console.warn(`Failed to play ${effectName} sound effect`, error);
  }
}
