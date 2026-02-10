import { all, get, run } from '@/src/db';
import type {
  CreateTaskInput,
  DbBoolean,
  ListTasksOptions,
  Task,
  TaskStatus,
  UpdateTaskPatch,
} from '@/src/db/types';
import { nowIso } from '@/src/utils/date';
import { generateId } from '@/src/utils/id';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const TASK_STATUS_DONE: TaskStatus = 'done';
const TASK_STATUS_TODO: TaskStatus = 'todo';

type TaskRow = {
  id: string;
  title: string;
  content: string | null;
  status: TaskStatus;
  pinned: DbBoolean;
  createdAt: string;
  updatedAt: string;
};

function toDbBoolean(value: boolean): DbBoolean {
  return value ? 1 : 0;
}

function fromDbBoolean(value: DbBoolean): boolean {
  return value === 1;
}

function normalizeLimit(limit?: number): number {
  if (!limit || limit < 1) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.min(limit, MAX_LIST_LIMIT);
}

function normalizeSearchInput(search?: string): string | null {
  const trimmed = search?.trim();
  if (!trimmed) {
    return null;
  }

  const escaped = trimmed.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  return `%${escaped}%`;
}

function mapTask(row: TaskRow): Task {
  return {
    ...row,
    pinned: fromDbBoolean(row.pinned),
  };
}

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  if (!normalized) {
    throw new Error('[tasks] title cannot be empty');
  }

  return normalized;
}

function normalizeContent(content?: string | null): string | null {
  if (content == null) {
    return null;
  }

  const normalized = content.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function createTask({ title, content }: CreateTaskInput): Promise<Task> {
  const id = generateId();
  const timestamp = nowIso();
  const normalizedTitle = normalizeTitle(title);
  const normalizedContent = normalizeContent(content);

  await run(
    `
      INSERT INTO tasks (id, title, content, status, pinned, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [id, normalizedTitle, normalizedContent, TASK_STATUS_TODO, 0, timestamp, timestamp],
  );

  return {
    id,
    title: normalizedTitle,
    content: normalizedContent,
    status: TASK_STATUS_TODO,
    pinned: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function getTaskById(id: string): Promise<Task | null> {
  const row = await get<TaskRow>(
    `
      SELECT id, title, content, status, pinned, createdAt, updatedAt
      FROM tasks
      WHERE id = ?
      LIMIT 1;
    `,
    [id],
  );

  return row ? mapTask(row) : null;
}

export async function updateTask(id: string, patch: UpdateTaskPatch): Promise<Task | null> {
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    updates.push('title = ?');
    params.push(normalizeTitle(patch.title));
  }

  if (patch.content !== undefined) {
    updates.push('content = ?');
    params.push(normalizeContent(patch.content));
  }

  if (patch.status !== undefined) {
    updates.push('status = ?');
    params.push(patch.status);
  }

  if (patch.pinned !== undefined) {
    updates.push('pinned = ?');
    params.push(toDbBoolean(patch.pinned));
  }

  if (updates.length === 0) {
    return getTaskById(id);
  }

  updates.push('updatedAt = ?');
  params.push(nowIso());
  params.push(id);

  await run(
    `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = ?;
    `,
    params,
  );

  return getTaskById(id);
}

export async function toggleTaskDone(id: string, done: boolean): Promise<Task | null> {
  await run(
    `
      UPDATE tasks
      SET status = ?, updatedAt = ?
      WHERE id = ?;
    `,
    [done ? TASK_STATUS_DONE : TASK_STATUS_TODO, nowIso(), id],
  );

  return getTaskById(id);
}

export async function togglePinned(id: string, pinned: boolean): Promise<Task | null> {
  await run(
    `
      UPDATE tasks
      SET pinned = ?, updatedAt = ?
      WHERE id = ?;
    `,
    [toDbBoolean(pinned), nowIso(), id],
  );

  return getTaskById(id);
}

export async function deleteTask(id: string): Promise<void> {
  await run(`DELETE FROM tasks WHERE id = ?;`, [id]);
}

export async function listTasks(options: ListTasksOptions = {}): Promise<Task[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }

  if (options.pinned !== undefined) {
    conditions.push('pinned = ?');
    params.push(toDbBoolean(options.pinned));
  }

  const normalizedSearch = normalizeSearchInput(options.search);
  if (normalizedSearch) {
    conditions.push(`(title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')`);
    params.push(normalizedSearch, normalizedSearch);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = normalizeLimit(options.limit);

  const rows = await all<TaskRow>(
    `
      SELECT id, title, content, status, pinned, createdAt, updatedAt
      FROM tasks
      ${whereClause}
      ORDER BY pinned DESC, createdAt DESC
      LIMIT ?;
    `,
    [...params, limit],
  );

  return rows.map(mapTask);
}
