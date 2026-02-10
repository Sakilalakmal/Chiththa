import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableWrapper } from '@/components/animations';
import { AppText } from '@/components/ui';
import type { Task } from '@/src/db/types';
import { colors, motion, radius, spacing, typography } from '@/theme';

import { TaskRow } from './TaskRow';

type CompletedSectionProps = {
  tasks: Task[];
  collapsed: boolean;
  onToggleCollapsed: (collapsed: boolean) => void;
  onToggleDone: (task: Task, done: boolean) => Promise<void> | void;
  onTogglePin: (task: Task, pinned: boolean) => Promise<void> | void;
  onDelete: (task: Task) => Promise<void> | void;
  startIndex?: number;
};

export function CompletedSection({
  tasks,
  collapsed,
  onToggleCollapsed,
  onToggleDone,
  onTogglePin,
  onDelete,
  startIndex = 0,
}: CompletedSectionProps) {
  const rotation = useSharedValue(collapsed ? 0 : 1);

  useEffect(() => {
    rotation.value = withTiming(collapsed ? 0 : 1, {
      duration: motion.durationNormal + 40,
    });
  }, [collapsed, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Animated.View layout={LinearTransition.duration(240)} style={styles.section}>
      <PressableWrapper
        style={styles.header}
        onPress={() => {
          void Haptics.selectionAsync();
          onToggleCollapsed(!collapsed);
        }}
        accessibilityRole="button"
        accessibilityLabel="Toggle completed tasks">
        <View style={styles.headerLeft}>
          <Animated.View style={iconStyle}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Animated.View>
          <AppText style={styles.title}>Completed</AppText>
        </View>
        <AppText variant="caption">{tasks.length}</AppText>
      </PressableWrapper>

      {!collapsed ? (
        <Animated.View
          entering={FadeIn.duration(motion.durationNormal + 80)}
          exiting={FadeOut.duration(motion.durationFast + 80)}
          layout={LinearTransition.duration(230)}
          style={styles.rows}>
          {tasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={startIndex + index}
              onToggleDone={onToggleDone}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
            />
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    minHeight: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.families.medium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  rows: {
    gap: spacing.xs,
  },
});
