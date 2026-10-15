import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Home, Sparkles, Bot, Leaf, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useApp } from '../../context/AppContext';
import { FeatureTourCoachmark } from '../../components/dashboard/FeatureTourCoachmark';

export default function TabLayout() {
  const { isAuthenticated, isOnboarded, isTourActive, skipTour } = useApp();

  // Route Guard: If not onboarded -> go to onboarding
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // Route Guard: If not authenticated -> go to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
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
        {/* Tab 1: Beranda */}
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

        {/* Tab 2: Rekomendasi */}
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

        {/* Tab 3: Chatbot (Agronomis AI) */}
        <Tabs.Screen
          name="chatbot"
          options={{
            title: 'Chatbot',
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
                <Bot size={20} color={color} />
              </View>
            ),
          }}
        />

        {/* Tab 4: Tracking */}
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

        {/* Tab 5: Profil */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <View className={focused ? 'bg-green-100/60 p-1.5 rounded-xl' : ''}>
                <User size={20} color={color} />
              </View>
            ),
          }}
        />

        {/* Hidden screen: Lahan (Diakses kontekstual dari Switcher Dashboard & Profile) */}
        <Tabs.Screen
          name="lahan"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Global Interactive Tur Fitur Overview Modal */}
      {isTourActive && (
        <FeatureTourCoachmark
          visible={isTourActive}
          onSkip={skipTour}
        />
      )}
    </View>
  );
}
