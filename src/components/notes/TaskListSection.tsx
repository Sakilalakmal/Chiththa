import { StyleSheet, View } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import type { Task } from '@/src/db/types';
import { colors, spacing, typography } from '@/theme';

import { TaskRow } from './TaskRow';

type TaskListSectionProps = {
  title: string;
  tasks: Task[];
  onToggleDone: (task: Task, done: boolean) => Promise<void> | void;
  onTogglePin: (task: Task, pinned: boolean) => Promise<void> | void;
  onDelete: (task: Task) => Promise<void> | void;
  startIndex?: number;
};

export function TaskListSection({
  title,
  tasks,
  onToggleDone,
  onTogglePin,
  onDelete,
  startIndex = 0,
}: TaskListSectionProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <Animated.View layout={LinearTransition.duration(230)} style={styles.section}>
      <View style={styles.headerRow}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText variant="caption" style={styles.count}>
          {tasks.length}
        </AppText>
      </View>

      <View style={styles.rows}>
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
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: typography.families.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  count: {
    color: colors.textSecondary,
  },
  rows: {
    gap: spacing.xs,
  },
});
