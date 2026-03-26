import * as SecureStore from 'expo-secure-store';

import { playersApi, type PlayerProfile } from './players';

const AUTH_TOKEN_KEY = 'auth_token';
const GUEST_EMAIL_KEY = 'guest_email';
const GUEST_PASSWORD_KEY = 'guest_password';
const GUEST_USERNAME_KEY = 'guest_username';
const PLAYER_ID_KEY = 'player_id';

function buildGuestIdentity() {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return {
    username: `guest_${suffix}`,
    email: `guest_${suffix}@frigi.local`,
    password: `frigi-${suffix}-${Math.random().toString(36).slice(2, 14)}`,
  };
}

async function clearAuthState() {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(PLAYER_ID_KEY),
  ]);
}

async function clearGuestIdentity() {
  await Promise.all([
    SecureStore.deleteItemAsync(GUEST_USERNAME_KEY),
    SecureStore.deleteItemAsync(GUEST_EMAIL_KEY),
    SecureStore.deleteItemAsync(GUEST_PASSWORD_KEY),
  ]);
}

async function persistGuestIdentity(identity: {
  username: string;
  email: string;
  password: string;
}) {
  await Promise.all([
    SecureStore.setItemAsync(GUEST_USERNAME_KEY, identity.username),
    SecureStore.setItemAsync(GUEST_EMAIL_KEY, identity.email),
    SecureStore.setItemAsync(GUEST_PASSWORD_KEY, identity.password),
  ]);
}

async function persistAuthenticatedPlayer(player: PlayerProfile, token: string) {
  await Promise.all([
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token),
    SecureStore.setItemAsync(PLAYER_ID_KEY, player.id),
  ]);
}

async function loginWithCredentials(email: string, password: string) {
  const token = await playersApi.login(email, password);
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token.access_token);
  const player = await playersApi.me();
  await persistAuthenticatedPlayer(player, token.access_token);
  console.info('[frigi][auth] login:success', {
    playerId: player.id,
    username: player.username,
    email: player.email,
  });
  return player;
}

async function registerAndLoginGuest() {
  const identity = buildGuestIdentity();
  await playersApi.register(identity.username, identity.email, identity.password);
  await persistGuestIdentity(identity);
  return loginWithCredentials(identity.email, identity.password);
}

export async function ensureAuthenticatedPlayer(): Promise<PlayerProfile> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (token) {
    try {
      const player = await playersApi.me();
      await SecureStore.setItemAsync(PLAYER_ID_KEY, player.id);
      console.info('[frigi][auth] reuse:token', {
        playerId: player.id,
        username: player.username,
        email: player.email,
      });
      return player;
    } catch {
      await clearAuthState();
    }
  }

  const [email, password] = await Promise.all([
    SecureStore.getItemAsync(GUEST_EMAIL_KEY),
    SecureStore.getItemAsync(GUEST_PASSWORD_KEY),
  ]);

  if (email && password) {
    try {
      console.info('[frigi][auth] reuse:guest-credentials', { email });
      return await loginWithCredentials(email, password);
    } catch {
      await Promise.all([
        clearAuthState(),
        SecureStore.deleteItemAsync(GUEST_USERNAME_KEY),
        SecureStore.deleteItemAsync(GUEST_EMAIL_KEY),
        SecureStore.deleteItemAsync(GUEST_PASSWORD_KEY),
      ]);
    }
  }

  console.info('[frigi][auth] create:guest');
  return registerAndLoginGuest();
}

export async function signOut(): Promise<void> {
  await clearAuthState();
}

export async function resetGuestIdentity(): Promise<void> {
  await Promise.all([clearAuthState(), clearGuestIdentity()]);
}
