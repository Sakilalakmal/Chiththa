import { all, get, run } from '@/src/db';
import type {
  CreateReadLinkInput,
  ListReadLinksOptions,
  ReadLink,
  ReadLinkSource,
  UpdateReadLinkPatch,
} from '@/src/db/types';
import { nowIso } from '@/src/utils/date';
import { generateId } from '@/src/utils/id';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

type ReadLinkRow = {
  id: string;
  title: string | null;
  url: string;
  source: ReadLinkSource;
  tags: string | null;
  savedAt: string;
  lastOpenedAt: string | null;
};

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

function normalizeOptionalText(value?: string | null): string | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeUrl(url: string): string {
  const normalized = url.trim();
  if (!normalized) {
    throw new Error('[read_links] url cannot be empty');
  }

  return normalized;
}

function mapReadLink(row: ReadLinkRow): ReadLink {
  return row;
}

async function getReadLinkById(id: string): Promise<ReadLink | null> {
  const row = await get<ReadLinkRow>(
    `
      SELECT id, title, url, source, tags, savedAt, lastOpenedAt
      FROM read_links
      WHERE id = ?
      LIMIT 1;
    `,
    [id],
  );

  return row ? mapReadLink(row) : null;
}

export async function createReadLink({
  url,
  title,
  source,
  tags,
}: CreateReadLinkInput): Promise<ReadLink> {
  const id = generateId();
  const savedAt = nowIso();
  const normalizedUrl = normalizeUrl(url);
  const normalizedTitle = normalizeOptionalText(title);
  const normalizedTags = normalizeOptionalText(tags);

  await run(
    `
      INSERT INTO read_links (id, title, url, source, tags, savedAt, lastOpenedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [id, normalizedTitle, normalizedUrl, source, normalizedTags, savedAt, null],
  );

  return {
    id,
    title: normalizedTitle,
    url: normalizedUrl,
    source,
    tags: normalizedTags,
    savedAt,
    lastOpenedAt: null,
  };
}

export async function updateReadLink(
  id: string,
  patch: UpdateReadLinkPatch,
): Promise<ReadLink | null> {
  const updates: string[] = [];
  const params: (string | null)[] = [];

  if (patch.url !== undefined) {
    updates.push('url = ?');
    params.push(normalizeUrl(patch.url));
  }

  if (patch.title !== undefined) {
    updates.push('title = ?');
    params.push(normalizeOptionalText(patch.title));
  }

  if (patch.source !== undefined) {
    updates.push('source = ?');
    params.push(patch.source);
  }

  if (patch.tags !== undefined) {
    updates.push('tags = ?');
    params.push(normalizeOptionalText(patch.tags));
  }

  if (patch.lastOpenedAt !== undefined) {
    updates.push('lastOpenedAt = ?');
    params.push(patch.lastOpenedAt);
  }

  if (updates.length === 0) {
    return getReadLinkById(id);
  }

  params.push(id);

  await run(
    `
      UPDATE read_links
      SET ${updates.join(', ')}
      WHERE id = ?;
    `,
    params,
  );

  return getReadLinkById(id);
}

export async function deleteReadLink(id: string): Promise<void> {
  await run(`DELETE FROM read_links WHERE id = ?;`, [id]);
}

export async function listReadLinks(options: ListReadLinksOptions = {}): Promise<ReadLink[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options.source) {
    conditions.push('source = ?');
    params.push(options.source);
  }

  const normalizedSearch = normalizeSearchInput(options.search);
  if (normalizedSearch) {
    conditions.push(`(title LIKE ? ESCAPE '\\' OR url LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\')`);
    params.push(normalizedSearch, normalizedSearch, normalizedSearch);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = normalizeLimit(options.limit);

  const rows = await all<ReadLinkRow>(
    `
      SELECT id, title, url, source, tags, savedAt, lastOpenedAt
      FROM read_links
      ${whereClause}
      ORDER BY savedAt DESC
      LIMIT ?;
    `,
    [...params, limit],
  );

  return rows.map(mapReadLink);
}

export async function markOpened(id: string): Promise<ReadLink | null> {
  await run(
    `
      UPDATE read_links
      SET lastOpenedAt = ?
      WHERE id = ?;
    `,
    [nowIso(), id],
  );

  return getReadLinkById(id);
}
