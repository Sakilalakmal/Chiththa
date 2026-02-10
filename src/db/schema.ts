export const SCHEMA_VERSION = 1;

export type MigrationStep = {
  version: number;
  statements: string[];
};

export const CREATE_META_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`;

const MIGRATION_V1_STATEMENTS: string[] = [
  `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT NOT NULL CHECK(status IN ('todo', 'done')),
      pinned INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_pinned ON tasks(pinned);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_createdAt ON tasks(createdAt);`,
  `
    CREATE TABLE IF NOT EXISTS voice_notes (
      id TEXT PRIMARY KEY,
      transcriptText TEXT,
      audioPath TEXT NOT NULL,
      duration INTEGER,
      createdAt TEXT NOT NULL
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_voice_notes_createdAt ON voice_notes(createdAt);`,
  `
    CREATE TABLE IF NOT EXISTS read_links (
      id TEXT PRIMARY KEY,
      title TEXT,
      url TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('reddit', 'medium', 'other')),
      tags TEXT,
      savedAt TEXT NOT NULL,
      lastOpenedAt TEXT
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_read_links_savedAt ON read_links(savedAt);`,
  `CREATE INDEX IF NOT EXISTS idx_read_links_source ON read_links(source);`,
];

export const MIGRATIONS: MigrationStep[] = [
  {
    version: 1,
    statements: MIGRATION_V1_STATEMENTS,
  },
];
