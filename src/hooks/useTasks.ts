import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createTask,
  createVoiceNote,
  deleteTask,
  listTasks,
  togglePinned,
  toggleTaskDone,
} from '@/src/db/repositories';
import type { Task } from '@/src/db/types';

const DEFAULT_LIST_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 180;

export type CreateVoiceTaskInput = {
  title?: string;
  content?: string | null;
  transcriptText?: string | null;
  audioPath?: string | null;
  durationMs?: number | null;
};

function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function deriveVoiceTitle(transcriptText?: string | null): string {
  const normalized = normalizeOptionalText(transcriptText);
  if (!normalized) {
    return 'Voice Chiththa';
  }

  const sentence = normalized.split(/[.!?\n]/)[0]?.trim() ?? normalized;
  if (!sentence) {
    return 'Voice Chiththa';
  }

  return sentence.length > 58 ? `${sentence.slice(0, 58).trimEnd()}...` : sentence;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const refresh = useCallback(async () => {
    try {
      setErrorMessage(null);
      const items = await listTasks({
        search: debouncedSearch,
        limit: DEFAULT_LIST_LIMIT,
      });
      setTasks(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tasks.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runMutation = useCallback(
    async (work: () => Promise<void>) => {
      setIsMutating(true);
      setErrorMessage(null);

      try {
        await work();
        await refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update tasks.';
        setErrorMessage(message);
      } finally {
        setIsMutating(false);
      }
    },
    [refresh],
  );

  const createTypedTask = useCallback(
    async (input: { title: string; content?: string | null }) => {
      await runMutation(async () => {
        await createTask(input);
      });
    },
    [runMutation],
  );

  const createVoiceTask = useCallback(
    async ({ title, content, transcriptText, audioPath, durationMs }: CreateVoiceTaskInput) => {
      await runMutation(async () => {
        const normalizedTranscript = normalizeOptionalText(transcriptText);
        const normalizedContent = normalizeOptionalText(content) ?? normalizedTranscript;
        const resolvedTitle = normalizeOptionalText(title) ?? deriveVoiceTitle(normalizedTranscript);

        if (audioPath) {
          await createVoiceNote({
            transcriptText: normalizedTranscript,
            audioPath,
            duration: durationMs ? Math.max(1, Math.round(durationMs / 1000)) : null,
          });
        }

        await createTask({
          title: resolvedTitle,
          content: normalizedContent,
        });
      });
    },
    [runMutation],
  );

  const setTaskDone = useCallback(
    async (task: Task, done: boolean) => {
      await runMutation(async () => {
        await toggleTaskDone(task.id, done);
      });
    },
    [runMutation],
  );

  const setTaskPinned = useCallback(
    async (task: Task, pinned: boolean) => {
      await runMutation(async () => {
        await togglePinned(task.id, pinned);
      });
    },
    [runMutation],
  );

  const removeTask = useCallback(
    async (task: Task) => {
      await runMutation(async () => {
        await deleteTask(task.id);
      });
    },
    [runMutation],
  );

  const pinnedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'todo' && task.pinned),
    [tasks],
  );

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status === 'todo' && !task.pinned),
    [tasks],
  );

  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'done'), [tasks]);

  return {
    tasks,
    pinnedTasks,
    activeTasks,
    completedTasks,
    isLoading,
    isMutating,
    errorMessage,
    searchQuery,
    setSearchQuery,
    refresh,
    createTypedTask,
    createVoiceTask,
    setTaskDone,
    setTaskPinned,
    removeTask,
  };
}
