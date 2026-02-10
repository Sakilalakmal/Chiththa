import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { PressableWrapper } from '@/components/animations';
import { AppText, Input, Screen } from '@/components/ui';
import {
  AddTaskSheet,
  CompletedSection,
  NotesEmptyState,
  TaskListSection,
  type CreateTypedInput,
  type CreateVoiceInput,
} from '@/src/components/notes';
import { useTasks } from '@/src/hooks/useTasks';
import type { Task } from '@/src/db/types';
import { borders, colors, radius, spacing } from '@/theme';

export default function NotesScreen() {
  const {
    tasks,
    pinnedTasks,
    activeTasks,
    completedTasks,
    isLoading,
    errorMessage,
    searchQuery,
    setSearchQuery,
    createTypedTask,
    createVoiceTask,
    setTaskDone,
    setTaskPinned,
    removeTask,
  } = useTasks();

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  const openCreateSheet = useCallback(() => {
    void Haptics.selectionAsync();
    setIsSheetVisible(true);
  }, []);

  const closeCreateSheet = useCallback(() => {
    setIsSheetVisible(false);
  }, []);

  const handleCreateTyped = useCallback(
    async (input: CreateTypedInput) => {
      await createTypedTask(input);
    },
    [createTypedTask],
  );

  const handleCreateVoice = useCallback(
    async (input: CreateVoiceInput) => {
      await createVoiceTask(input);
    },
    [createVoiceTask],
  );

  const hasNoTasks = tasks.length === 0;
  const isSearching = searchQuery.trim().length > 0;

  const sectionCount = useMemo(() => {
    let count = 0;
    if (pinnedTasks.length > 0) {
      count += 1;
    }
    if (activeTasks.length > 0) {
      count += 1;
    }
    if (completedTasks.length > 0) {
      count += 1;
    }
    return count;
  }, [activeTasks.length, completedTasks.length, pinnedTasks.length]);

  const handleToggleDone = useCallback((task: Task, done: boolean) => setTaskDone(task, done), [setTaskDone]);
  const handleTogglePin = useCallback(
    (task: Task, pinned: boolean) => setTaskPinned(task, pinned),
    [setTaskPinned],
  );
  const handleDelete = useCallback((task: Task) => removeTask(task), [removeTask]);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <AppText variant="title">Notes</AppText>
          <AppText variant="caption">Tasks and thought fragments captured with calm focus.</AppText>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color={colors.textSecondary} style={styles.searchIcon} />
          <Input
            placeholder="Search Chiththa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchInputContainer}
            inputStyle={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.emptyBlock}>
              <AppText variant="caption">Loading your Chiththa...</AppText>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.errorBlock}>
              <AppText variant="caption" style={styles.errorText}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          {!isLoading && hasNoTasks ? (
            <NotesEmptyState
              title={isSearching ? 'No matching Chiththa' : 'Your notes will appear here'}
              message={
                isSearching
                  ? 'Try a different search phrase.'
                  : 'Tap + to create a new task or capture one with your voice.'
              }
            />
          ) : null}

          {!isLoading && sectionCount > 0 ? (
            <Animated.View layout={LinearTransition.duration(240)} style={styles.sections}>
              <TaskListSection
                title="Pinned"
                tasks={pinnedTasks}
                onToggleDone={handleToggleDone}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                startIndex={0}
              />

              <TaskListSection
                title="Today / Recent"
                tasks={activeTasks}
                onToggleDone={handleToggleDone}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                startIndex={pinnedTasks.length}
              />

              <CompletedSection
                tasks={completedTasks}
                collapsed={completedCollapsed}
                onToggleCollapsed={setCompletedCollapsed}
                onToggleDone={handleToggleDone}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
                startIndex={pinnedTasks.length + activeTasks.length}
              />
            </Animated.View>
          ) : null}

          {!isLoading && !hasNoTasks && pinnedTasks.length + activeTasks.length === 0 ? (
            <NotesEmptyState
              title="All caught up"
              message="Everything is completed. Add a new Chiththa when you are ready."
            />
          ) : null}
        </ScrollView>

        <PressableWrapper
          style={styles.fab}
          onPress={openCreateSheet}
          accessibilityRole="button"
          accessibilityLabel="Create task">
          <Ionicons name="add" size={26} color={colors.white} />
        </PressableWrapper>
      </View>

      <AddTaskSheet
        visible={isSheetVisible}
        onRequestClose={closeCreateSheet}
        onCreateTyped={handleCreateTyped}
        onCreateVoice={handleCreateVoice}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  searchWrap: {
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },
  searchInputContainer: {
    minHeight: 56,
  },
  searchInput: {
    paddingLeft: spacing.xl + 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
    gap: spacing.lg,
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  errorBlock: {
    borderWidth: borders.thin,
    borderColor: '#D6B4B4',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FCF4F4',
  },
  errorText: {
    color: '#9F4A4A',
  },
  sections: {
    gap: spacing.xl,
  },
  fab: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.black,
    borderWidth: borders.thin,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
});
