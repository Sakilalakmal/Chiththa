import {
  openDatabaseAsync,
  type SQLiteBindValue,
  type SQLiteDatabase,
  type SQLiteRunResult,
} from 'expo-sqlite';

import { CREATE_META_TABLE_SQL, MIGRATIONS, SCHEMA_VERSION } from './schema';

export const DATABASE_NAME = 'chiththa.db';

const META_SCHEMA_VERSION_KEY = 'schema_version';
const ENABLE_FOREIGN_KEYS_SQL = 'PRAGMA foreign_keys = ON;';

type SchemaVersionRow = {
  value: string | null;
};

export type SqlParams = SQLiteBindValue[];

let dbPromise: Promise<SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function formatDbError(action: string, sql: string, error: unknown): Error {
  const message = getErrorMessage(error);
  return new Error(`[db:${action}] ${message} | sql: ${sql}`);
}

function sortMigrationsAsc<T extends { version: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.version - right.version);
}

async function ensureMetaTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_META_TABLE_SQL);
}

async function runOnDb(
  db: SQLiteDatabase,
  sql: string,
  params: SqlParams = [],
): Promise<SQLiteRunResult> {
  try {
    return await db.runAsync(sql, params);
  } catch (error) {
    throw formatDbError('run', sql, error);
  }
}

async function getOnDb<T>(db: SQLiteDatabase, sql: string, params: SqlParams = []): Promise<T | null> {
  try {
    return await db.getFirstAsync<T>(sql, params);
  } catch (error) {
    throw formatDbError('get', sql, error);
  }
}

async function allOnDb<T>(db: SQLiteDatabase, sql: string, params: SqlParams = []): Promise<T[]> {
  try {
    return await db.getAllAsync<T>(sql, params);
  } catch (error) {
    throw formatDbError('all', sql, error);
  }
}

export async function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME);
  }

  return dbPromise;
}

export async function getSchemaVersion(existingDb?: SQLiteDatabase): Promise<number> {
  const db = existingDb ?? (await getDb());
  await ensureMetaTable(db);

  const row = await getOnDb<SchemaVersionRow>(
    db,
    `SELECT value FROM app_meta WHERE key = ? LIMIT 1;`,
    [META_SCHEMA_VERSION_KEY],
  );

  const parsedVersion = Number.parseInt(row?.value ?? '0', 10);
  if (Number.isNaN(parsedVersion)) {
    return 0;
  }

  return parsedVersion;
}

export async function setSchemaVersion(version: number, existingDb?: SQLiteDatabase): Promise<void> {
  const db = existingDb ?? (await getDb());
  await ensureMetaTable(db);

  await runOnDb(
    db,
    `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `,
    [META_SCHEMA_VERSION_KEY, String(version)],
  );
}

export async function migrateIfNeeded(): Promise<void> {
  const db = await getDb();

  await db.execAsync(ENABLE_FOREIGN_KEYS_SQL);
  await ensureMetaTable(db);

  const currentVersion = await getSchemaVersion(db);
  if (currentVersion > SCHEMA_VERSION) {
    throw new Error(
      `[db:migrate] schema version ${currentVersion} is newer than supported ${SCHEMA_VERSION}`,
    );
  }

  const pendingMigrations = sortMigrationsAsc(MIGRATIONS).filter(
    (migration) => migration.version > currentVersion && migration.version <= SCHEMA_VERSION,
  );

  for (const migration of pendingMigrations) {
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }

      await setSchemaVersion(migration.version, db);
    });
  }
}

export async function initDb(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    await migrateIfNeeded();
  })();

  try {
    await initPromise;
  } catch (error) {
    initPromise = null;
    throw new Error(`[db:init] ${getErrorMessage(error)}`);
  }
}

export async function run(sql: string, params: SqlParams = []): Promise<SQLiteRunResult> {
  await initDb();
  const db = await getDb();
  return runOnDb(db, sql, params);
}

export async function get<T>(sql: string, params: SqlParams = []): Promise<T | null> {
  await initDb();
  const db = await getDb();
  return getOnDb<T>(db, sql, params);
}

export async function all<T>(sql: string, params: SqlParams = []): Promise<T[]> {
  await initDb();
  const db = await getDb();
  return allOnDb<T>(db, sql, params);
}
