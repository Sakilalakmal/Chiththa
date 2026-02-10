import { all, get, run } from '@/src/db';
import type {
  CreateVoiceNoteInput,
  ListVoiceNotesOptions,
  UpdateVoiceNotePatch,
  VoiceNote,
} from '@/src/db/types';
import { nowIso } from '@/src/utils/date';
import { generateId } from '@/src/utils/id';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

type VoiceNoteRow = {
  id: string;
  transcriptText: string | null;
  audioPath: string;
  duration: number | null;
  createdAt: string;
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

function normalizeTranscript(transcriptText?: string | null): string | null {
  if (transcriptText == null) {
    return null;
  }

  const normalized = transcriptText.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeAudioPath(audioPath: string): string {
  const normalized = audioPath.trim();
  if (!normalized) {
    throw new Error('[voice_notes] audioPath cannot be empty');
  }

  return normalized;
}

function mapVoiceNote(row: VoiceNoteRow): VoiceNote {
  return row;
}

async function getVoiceNoteById(id: string): Promise<VoiceNote | null> {
  const row = await get<VoiceNoteRow>(
    `
      SELECT id, transcriptText, audioPath, duration, createdAt
      FROM voice_notes
      WHERE id = ?
      LIMIT 1;
    `,
    [id],
  );

  return row ? mapVoiceNote(row) : null;
}

export async function createVoiceNote({
  transcriptText,
  audioPath,
  duration,
}: CreateVoiceNoteInput): Promise<VoiceNote> {
  const id = generateId();
  const createdAt = nowIso();
  const normalizedTranscript = normalizeTranscript(transcriptText);
  const normalizedAudioPath = normalizeAudioPath(audioPath);
  const normalizedDuration = duration ?? null;

  await run(
    `
      INSERT INTO voice_notes (id, transcriptText, audioPath, duration, createdAt)
      VALUES (?, ?, ?, ?, ?);
    `,
    [id, normalizedTranscript, normalizedAudioPath, normalizedDuration, createdAt],
  );

  return {
    id,
    transcriptText: normalizedTranscript,
    audioPath: normalizedAudioPath,
    duration: normalizedDuration,
    createdAt,
  };
}

export async function updateVoiceNote(
  id: string,
  patch: UpdateVoiceNotePatch,
): Promise<VoiceNote | null> {
  const updates: string[] = [];
  const params: (string | number | null)[] = [];

  if (patch.transcriptText !== undefined) {
    updates.push('transcriptText = ?');
    params.push(normalizeTranscript(patch.transcriptText));
  }

  if (patch.audioPath !== undefined) {
    updates.push('audioPath = ?');
    params.push(normalizeAudioPath(patch.audioPath));
  }

  if (patch.duration !== undefined) {
    updates.push('duration = ?');
    params.push(patch.duration);
  }

  if (updates.length === 0) {
    return getVoiceNoteById(id);
  }

  params.push(id);

  await run(
    `
      UPDATE voice_notes
      SET ${updates.join(', ')}
      WHERE id = ?;
    `,
    params,
  );

  return getVoiceNoteById(id);
}

export async function deleteVoiceNote(id: string): Promise<void> {
  await run(`DELETE FROM voice_notes WHERE id = ?;`, [id]);
}

export async function listVoiceNotes(options: ListVoiceNotesOptions = {}): Promise<VoiceNote[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  const normalizedSearch = normalizeSearchInput(options.search);
  if (normalizedSearch) {
    conditions.push(`(transcriptText LIKE ? ESCAPE '\\' OR audioPath LIKE ? ESCAPE '\\')`);
    params.push(normalizedSearch, normalizedSearch);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = normalizeLimit(options.limit);

  const rows = await all<VoiceNoteRow>(
    `
      SELECT id, transcriptText, audioPath, duration, createdAt
      FROM voice_notes
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ?;
    `,
    [...params, limit],
  );

  return rows.map(mapVoiceNote);
}
