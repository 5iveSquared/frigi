import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { frigi } from '~/utils/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: frigi.red,
        tabBarInactiveTintColor: frigi.textMuted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
