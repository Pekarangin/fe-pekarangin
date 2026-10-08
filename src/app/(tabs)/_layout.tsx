import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Trees, Sparkles, Leaf, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function TabLayout() {
  const { isAuthenticated, isOnboarded } = useApp();

  // Route Guard: If not onboarded -> go to onboarding
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // Route Guard: If not authenticated -> go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1C7430',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F3F4F6',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Home size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lahan"
        options={{
          title: 'Lahan',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Trees size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rekomendasi"
        options={{
          title: 'Rekomendasi',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Sparkles size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <Leaf size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
              <User size={20} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
