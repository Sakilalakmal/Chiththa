import { useCallback, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PressableWrapper } from '@/components/animations';
import { AppText } from '@/components/ui';
import type { Task } from '@/src/db/types';
import { borders, colors, motion, radius, spacing, typography } from '@/theme';

type TaskRowProps = {
  task: Task;
  index: number;
  onToggleDone: (task: Task, done: boolean) => Promise<void> | void;
  onTogglePin: (task: Task, pinned: boolean) => Promise<void> | void;
  onDelete: (task: Task) => Promise<void> | void;
};

const ACTIVE_ROW_OPACITY = 1;
const DONE_ROW_OPACITY = 0.62;

export function TaskRow({ task, index, onToggleDone, onTogglePin, onDelete }: TaskRowProps) {
  const doneProgress = useSharedValue(task.status === 'done' ? 1 : 0);
  const pinScale = useSharedValue(1);

  useEffect(() => {
    doneProgress.value = withTiming(task.status === 'done' ? 1 : 0, {
      duration: motion.durationNormal + 90,
    });
  }, [doneProgress, task.status]);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(doneProgress.value, [0, 1], [ACTIVE_ROW_OPACITY, DONE_ROW_OPACITY]),
    transform: [
      {
        translateX: interpolate(doneProgress.value, [0, 1], [0, 8]),
      },
    ],
  }));

  const pinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinScale.value }],
  }));

  const handleToggleDone = useCallback(() => {
    void Haptics.selectionAsync();
    void onToggleDone(task, task.status !== 'done');
  }, [onToggleDone, task]);

  const handleTogglePin = useCallback(() => {
    pinScale.value = withSequence(
      withTiming(1.18, { duration: motion.durationFast + 30 }),
      withTiming(1, { duration: motion.durationFast + 20 }),
    );

    void Haptics.selectionAsync();
    void onTogglePin(task, !task.pinned);
  }, [onTogglePin, pinScale, task]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Chiththa?', 'This will permanently remove this task.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void onDelete(task);
        },
      },
    ]);
  }, [onDelete, task]);

  const isDone = task.status === 'done';

  return (
    <Animated.View
      entering={FadeInDown.duration(motion.durationNormal + 80).delay(Math.min(index * 24, 180))}
      layout={LinearTransition.duration(motion.durationNormal + 90)}
      style={rowAnimatedStyle}>
      <PressableWrapper
        delayLongPress={340}
        onLongPress={handleDelete}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`Task: ${task.title}`}>
        <View style={styles.leftGroup}>
          <PressableWrapper
            onPress={handleToggleDone}
            style={[styles.checkbox, isDone && styles.checkboxDone]}
            accessibilityRole="button"
            accessibilityLabel={isDone ? 'Mark as not done' : 'Mark as done'}>
            {isDone ? <Ionicons name="checkmark" size={16} color={colors.black} /> : null}
          </PressableWrapper>

          <View style={styles.content}>
            <AppText numberOfLines={2} style={[styles.title, isDone && styles.titleDone]}>
              {task.title}
            </AppText>
            {task.content ? (
              <AppText variant="caption" numberOfLines={1} style={styles.preview}>
                {task.content}
              </AppText>
            ) : null}
          </View>
        </View>

        <PressableWrapper
          onPress={handleTogglePin}
          style={styles.pinButton}
          accessibilityRole="button"
          accessibilityLabel={task.pinned ? 'Unpin task' : 'Pin task'}>
          <Animated.View style={pinAnimatedStyle}>
            <Ionicons
              name={task.pinned ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={task.pinned ? colors.black : colors.textSecondary}
            />
          </Animated.View>
        </PressableWrapper>
      </PressableWrapper>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: borders.thin,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxDone: {
    borderColor: colors.success,
    backgroundColor: '#E8F4ED',
  },
  content: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    fontFamily: typography.families.medium,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  preview: {
    color: colors.textSecondary,
  },
  pinButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
