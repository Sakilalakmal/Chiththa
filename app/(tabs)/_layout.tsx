import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { borders, colors, layout, spacing, typography } from '@/theme';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="listen"
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="listen"
        options={{
          title: 'Listen',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? 'headset' : 'headset-outline'}
              size={layout.tabIconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? 'document-text' : 'document-text-outline'}
              size={layout.tabIconSize}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="read"
        options={{
          title: 'Read',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons color={color} name={focused ? 'book' : 'book-outline'} size={layout.tabIconSize} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: layout.tabBarHeight,
    backgroundColor: colors.background,
    borderTopWidth: borders.thin,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  tabLabel: {
    fontFamily: typography.families.medium,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
});
